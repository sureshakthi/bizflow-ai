import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => QueueGateway)) private readonly gateway: QueueGateway,
    @Inject(forwardRef(() => WhatsappService)) private readonly whatsapp: WhatsappService,
  ) {}

  async getQueueByDoctor(doctorId: string) {
    return this.prisma.token.findMany({
      where: { doctorId, status: { in: ['WAITING', 'IN_PROGRESS'] } },
      include: { patient: true, doctor: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getQueueStatus(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { doctor: true },
    });
    if (!token) return null;

    const ahead = await this.prisma.token.count({
      where: {
        doctorId: token.doctorId,
        status: 'WAITING',
        createdAt: { lt: token.createdAt },
      },
    });

    const currentlyServing = await this.prisma.token.findFirst({
      where: { doctorId: token.doctorId, status: 'IN_PROGRESS' },
    });

    return {
      token,
      patientsAhead: ahead,
      currentlyServing: currentlyServing?.tokenNumber || null,
      estimatedWait: ahead * 15,
    };
  }

  async callNext(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: 'IN_PROGRESS', calledAt: new Date() },
      include: { patient: true, doctor: true },
    });
    await this.recalculateQueue(token.doctorId);
    await this.gateway.broadcastQueueUpdate();
    // Notify patient ahead via WhatsApp
    if ((token as any).patient?.phone) {
      await this.whatsapp.sendText(
        (token as any).patient.phone,
        `🔔 *It's your turn!*\n\nToken: *${token.tokenNumber}*\nPlease proceed to the doctor's room now.`,
      );
    }
    return token;
  }

  async skipPatient(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: 'SKIPPED' },
      include: { patient: true },
    });
    await this.recalculateQueue(token.doctorId);
    await this.gateway.broadcastQueueUpdate();
    if ((token as any).patient?.phone) {
      await this.whatsapp.sendText(
        (token as any).patient.phone,
        `⚠️ Token *${token.tokenNumber}* was skipped.\n\nPlease contact reception to rejoin the queue.\n\nReply *menu* for options.`,
      );
    }
    return token;
  }

  async completePatient(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { patient: true, doctor: true },
    });
    await this.recalculateQueue(token.doctorId);
    await this.gateway.broadcastQueueUpdate();
    // Send feedback request via WhatsApp
    if ((token as any).patient?.phone && (token as any).doctor?.name) {
      setTimeout(() => {
        this.whatsapp
          .sendFeedbackRequest((token as any).patient.phone, token.id, (token as any).doctor.name)
          .catch(() => {});
      }, 2000);
    }
    return token;
  }

  async recalculateQueue(doctorId: string) {
    const tokens = await this.prisma.token.findMany({
      where: { doctorId, status: 'WAITING' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    for (let i = 0; i < tokens.length; i++) {
      await this.prisma.token.update({
        where: { id: tokens[i].id },
        data: { queuePosition: i + 1, estimatedWait: (i + 1) * 15 },
      });
    }
  }

  async getTvDisplayData() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tokens = await this.prisma.token.findMany({
      where: { createdAt: { gte: now } },
      include: { doctor: true },
      orderBy: { createdAt: 'asc' },
    });

    const doctors = await this.prisma.doctor.findMany({ where: { isAvailable: true } });

    const display = doctors.map((doc) => {
      const docTokens = tokens.filter((t) => t.doctorId === doc.id);
      return {
        doctor: doc.name,
        specialization: doc.specialization,
        nowServing: docTokens.find((t) => t.status === 'IN_PROGRESS')?.tokenNumber || null,
        waiting: docTokens.filter((t) => t.status === 'WAITING').map((t) => t.tokenNumber),
        completed: docTokens.filter((t) => t.status === 'COMPLETED').length,
      };
    });

    return { display, updatedAt: new Date() };
  }
}
