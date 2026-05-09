import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        visitId: dto.visitId,
        notes: dto.notes,
        medicines: {
          create: (dto.medicines || []).map((m: any) => ({
            name: m.name,
            dosage: m.dosage,
            timing: m.timing,
            frequency: m.frequency,
            duration: m.duration,
            notes: m.notes,
          })),
        },
      },
      include: { medicines: true },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: { medicines: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true, doctor: true, patient: true },
    });
  }
}
