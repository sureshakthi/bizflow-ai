import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { LabReportService } from './lab-report.service';

@Controller('lab-reports')
export class LabReportController {
  constructor(private readonly labReportService: LabReportService) {}

  @Post()
  create(@Body() dto: any) {
    return this.labReportService.create(dto);
  }

  @Get('patient/:patientId')
  getByPatient(@Param('patientId') patientId: string) {
    return this.labReportService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labReportService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: any) {
    return this.labReportService.updateStatus(id, dto.status);
  }

  @Post(':id/values')
  addTestValues(@Param('id') id: string, @Body() dto: any) {
    return this.labReportService.addTestValues(id, dto.values);
  }
}
