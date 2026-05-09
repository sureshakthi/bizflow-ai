import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PreconsultService {
  constructor(private readonly prisma: PrismaService) {}

  async submitForm(tokenId: string, dto: any) {
    const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');
    return this.prisma.preConsultForm.create({
      data: {
        tokenId,
        patientId: token.patientId,
        visitType: dto.visitType,
        maritalStatus: dto.maritalStatus,
        spouseName: dto.spouseName,
        lmpDate: dto.lmpDate ? new Date(dto.lmpDate) : null,
        pregnancyHistory: dto.pregnancyHistory,
        allergies: dto.allergies,
        currentMedications: dto.currentMedications,
        questionsAnswered: dto.questionsAnswered || 7,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getForm(tokenId: string) {
    return this.prisma.preConsultForm.findFirst({
      where: { tokenId },
      include: { token: { include: { patient: true } } },
    });
  }

  async getFormHistory(patientId: string) {
    return this.prisma.preConsultForm.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
