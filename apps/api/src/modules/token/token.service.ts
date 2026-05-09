import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { QueueService } from '../queue/queue.service';

@Injectable()
export class TokenService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  private async getNextDailyNumber(deptCode: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const lastToken = await this.prisma.token.findFirst({
      where: { deptCode, date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { dailyNumber: 'desc' },
    });
    return (lastToken?.dailyNumber ?? 0) + 1;
  }

  async generateToken(data: {
    patientId: string;
    doctorId: string;
    purpose: string;
    deptCode: string;
    priority?: number;
    appointmentId?: string;
  }) {
    const today = new Date();
    const dailyNumber = await this.getNextDailyNumber(data.deptCode, today);
    const tokenNumber = `${data.deptCode}-${String(dailyNumber).padStart(3, '0')}`;

    const token = await this.prisma.token.create({
      data: {
        tokenNumber,
        deptCode: data.deptCode,
        dailyNumber,
        patientId: data.patientId,
        doctorId: data.doctorId,
        purpose: data.purpose,
        priority: data.priority ?? 0,
        appointmentId: data.appointmentId,
        date: today,
      },
      include: { patient: true, doctor: true },
    });

    // Update queue positions
    await this.queueService.recalculateQueue(data.doctorId);
    return token;
  }

  async findByTokenNumber(tokenNumber: string) {
    return this.prisma.token.findUnique({
      where: { tokenNumber },
      include: { patient: true, doctor: true, preConsultForm: true },
    });
  }

  async updateStatus(id: string, status: string) {
    const token = await this.prisma.token.update({
      where: { id },
      data: {
        status,
        ...(status === 'IN_PROGRESS' && { calledAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: { patient: true, doctor: true },
    });

    await this.queueService.recalculateQueue(token.doctorId);
    return token;
  }

  async getTodaysTokens(doctorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.token.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        ...(doctorId && { doctorId }),
      },
      include: { patient: true, doctor: true, preConsultForm: true },
      orderBy: [{ priority: 'desc' }, { dailyNumber: 'asc' }],
    });
  }
}
