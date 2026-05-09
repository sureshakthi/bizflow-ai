import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async createSlot(dto: any) {
    return this.prisma.scheduleSlot.create({
      data: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotType: dto.slotType || 'BOTH',
        isActive: true,
      },
    });
  }

  async getDoctorSchedule(doctorId: string, date?: string) {
    if (date) {
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      return this.prisma.scheduleSlot.findMany({
        where: { doctorId, dayOfWeek, isActive: true },
      });
    }
    return this.prisma.scheduleSlot.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    const schedules = await this.prisma.scheduleSlot.findMany({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: d, lt: nextDay },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const bookedTimes = existingAppointments.map((a) => a.timeSlot);

    const slots: string[] = [];
    for (const schedule of schedules) {
      let current = this.timeToMinutes(schedule.startTime);
      const end = this.timeToMinutes(schedule.endTime);
      while (current < end) {
        const timeStr = this.minutesToTime(current);
        if (!bookedTimes.includes(timeStr)) {
          slots.push(timeStr);
        }
        current += 15; // default 15 min slots
      }
    }

    return { date, doctorId, availableSlots: slots };
  }

  async blockSlot(id: string) {
    return this.prisma.scheduleSlot.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteSlot(id: string) {
    return this.prisma.scheduleSlot.delete({ where: { id } });
  }

  async markLeave(doctorId: string, dto: any) {
    return this.prisma.doctorLeave.create({
      data: {
        doctorId,
        date: new Date(dto.date),
        reason: dto.reason,
      },
    });
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
