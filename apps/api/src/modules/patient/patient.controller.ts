import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.patientService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.patientService.findById(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.patientService.getPatientHistory(id);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.patientService.findByPhone(phone);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, dto);
  }
}
