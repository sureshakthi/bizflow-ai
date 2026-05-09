import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.feedback.create({
      data: {
        patientId: dto.patientId,
        rating: dto.rating,
        comment: dto.comment,
        category: dto.category,
      },
    });
  }

  async findAll(rating?: number) {
    const where: any = {};
    if (rating) where.rating = rating;
    return this.prisma.feedback.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const all = await this.prisma.feedback.findMany();
    const total = all.length;
    const avgRating = total ? all.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    const distribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: all.filter((f) => f.rating === r).length,
    }));
    return { total, avgRating: Math.round(avgRating * 10) / 10, distribution };
  }

  async findByPatient(patientId: string) {
    return this.prisma.feedback.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
