import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  create(@Body() dto: any) {
    return this.prescriptionService.create(dto);
  }

  @Get('patient/:patientId')
  getByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionService.findOne(id);
  }
}
