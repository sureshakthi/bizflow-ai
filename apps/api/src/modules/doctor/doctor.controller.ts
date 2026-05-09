import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Get()
  findAll() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.doctorService.findById(id);
  }

  @Get('dept/:deptCode')
  findByDept(@Param('deptCode') deptCode: string) {
    return this.doctorService.findByDept(deptCode);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; delayMinutes?: number }) {
    return this.doctorService.updateStatus(id, body.status, body.delayMinutes);
  }

  @Post()
  create(@Body() body: { name: string; specialization: string; deptCode: string; fees: number; digitalFees?: number; roomNumber?: string }) {
    return this.doctorService.create(body);
  }
}
