import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.labReport.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        testName: dto.testName,
        status: 'ORDERED',
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.labReport.findMany({
      where: { patientId },
      include: { testValues: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.labReport.findUnique({
      where: { id },
      include: { testValues: true, doctor: true, patient: true },
    });
  }

  async updateStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'READY') data.readyAt = new Date();
    return this.prisma.labReport.update({ where: { id }, data });
  }

  async addTestValues(id: string, values: any[]) {
    return this.prisma.labReport.update({
      where: { id },
      data: {
        testValues: {
          create: values.map((v) => ({
            parameter: v.parameter,
            value: v.value,
            unit: v.unit,
            normalRange: v.normalRange,
            isAbnormal: v.isAbnormal || false,
          })),
        },
      },
      include: { testValues: true },
    });
  }
}
