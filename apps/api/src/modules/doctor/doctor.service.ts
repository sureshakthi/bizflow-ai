import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.doctor.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.doctor.findUnique({ where: { id } });
  }

  async findByDept(deptCode: string) {
    return this.prisma.doctor.findMany({
      where: { deptCode, isAvailable: true },
    });
  }

  async updateStatus(id: string, status: string, delayMinutes?: number) {
    return this.prisma.doctor.update({
      where: { id },
      data: { status, ...(delayMinutes !== undefined && { delayMinutes }) },
    });
  }

  async create(data: { name: string; specialization: string; deptCode: string; fees: number; digitalFees?: number; roomNumber?: string }) {
    return this.prisma.doctor.create({ data: { ...data, fees: data.fees, digitalFees: data.digitalFees } });
  }
}
