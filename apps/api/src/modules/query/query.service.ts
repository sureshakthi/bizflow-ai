import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QueryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    // Level 1: Bot auto-response attempt
    const botResponse = await this.attemptBotResponse(dto.question);

    return this.prisma.patientQuery.create({
      data: {
        patientId: dto.patientId,
        question: dto.question,
        category: dto.category,
        level: botResponse ? 'BOT' : 'STAFF',
        botAnswer: botResponse,
        status: botResponse ? 'RESOLVED' : 'NEW',
      },
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.patientQuery.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.patientQuery.findUnique({
      where: { id },
      include: { patient: true },
    });
  }

  async respond(id: string, dto: any) {
    return this.prisma.queryReply.create({
      data: {
        queryId: id,
        userId: dto.respondedBy,
        message: dto.response,
        level: 'STAFF',
      },
    });
  }

  async escalate(id: string, dto: any) {
    return this.prisma.patientQuery.update({
      where: { id },
      data: {
        level: dto.escalateTo || 'DOCTOR',
        status: 'ESCALATED',
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.patientQuery.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async attemptBotResponse(question: string): Promise<string | null> {
    // Placeholder for OpenAI GPT-4o integration
    // Will check FAQ database and generate response
    return null;
  }
}
