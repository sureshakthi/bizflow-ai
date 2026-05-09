import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriceListService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.priceListItem.create({
      data: {
        name: dto.serviceName,
        category: dto.category,
        price: dto.price,
        isActive: true,
      },
    });
  }

  async findAll() {
    return this.prisma.priceListItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.priceListItem.findUnique({ where: { id } });
  }

  async update(id: string, dto: any) {
    return this.prisma.priceListItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.priceListItem.update({ where: { id }, data: { isActive: false } });
  }
}
