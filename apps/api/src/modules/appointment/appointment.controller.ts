import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, RescheduleAppointmentDto } from './dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @Get()
  findAll(@Query('date') date?: string, @Query('doctorId') doctorId?: string) {
    return this.appointmentService.findAll({ date, doctorId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentService.reschedule(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.appointmentService.cancel(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.appointmentService.confirm(id);
  }

  @Patch(':id/no-show')
  markNoShow(@Param('id') id: string) {
    return this.appointmentService.markNoShow(id);
  }

  @Get('patient/:patientId')
  getByPatient(@Param('patientId') patientId: string) {
    return this.appointmentService.findByPatient(patientId);
  }
}
