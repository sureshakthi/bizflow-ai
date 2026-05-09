import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Patient with this phone already exists');
    }
    return this.prisma.patient.create({ data: dto });
  }

  async findByPhone(phone: string) {
    return this.prisma.patient.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findById(id);
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  async getPatientHistory(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        visits: { include: { doctor: true, prescriptions: true }, orderBy: { createdAt: 'desc' } },
        appointments: { include: { doctor: true }, orderBy: { date: 'desc' } },
        labReports: { orderBy: { createdAt: 'desc' } },
        prescriptions: { include: { medicines: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  }
}
