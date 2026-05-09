import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { PriceListService } from './price-list.service';

@Controller('price-list')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Post()
  create(@Body() dto: any) {
    return this.priceListService.create(dto);
  }

  @Get()
  findAll() {
    return this.priceListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceListService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.priceListService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.priceListService.remove(id);
  }
}
