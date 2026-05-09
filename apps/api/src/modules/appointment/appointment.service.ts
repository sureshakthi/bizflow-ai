import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, RescheduleAppointmentDto } from './dto';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        date: new Date(dto.appointmentDate),
        timeSlot: dto.appointmentTime,
        type: dto.mode as any,
        purpose: 'CONSULTATION',
        fees: 0,
        status: 'CONFIRMED',
      },
    });
  }

  async findAll(filters: { date?: string; doctorId?: string }) {
    const where: any = {};
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (filters.doctorId) where.doctorId = filters.doctorId;

    return this.prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { timeSlot: 'asc' },
    });
  }

  async findOne(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        date: new Date(dto.newDate),
        timeSlot: dto.newTime,
        status: 'RESCHEDULED',
      },
    });
  }

  async cancel(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async confirm(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async markNoShow(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'NO_SHOW' },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: true },
      orderBy: { date: 'desc' },
    });
  }
}
