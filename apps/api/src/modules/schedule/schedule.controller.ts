import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  createSlot(@Body() dto: any) {
    return this.scheduleService.createSlot(dto);
  }

  @Get('doctor/:doctorId')
  getDoctorSchedule(@Param('doctorId') doctorId: string, @Query('date') date?: string) {
    return this.scheduleService.getDoctorSchedule(doctorId, date);
  }

  @Get('available/:doctorId')
  getAvailableSlots(@Param('doctorId') doctorId: string, @Query('date') date: string) {
    return this.scheduleService.getAvailableSlots(doctorId, date);
  }

  @Patch(':id/block')
  blockSlot(@Param('id') id: string) {
    return this.scheduleService.blockSlot(id);
  }

  @Delete(':id')
  deleteSlot(@Param('id') id: string) {
    return this.scheduleService.deleteSlot(id);
  }

  @Post('doctor/:doctorId/leave')
  markLeave(@Param('doctorId') doctorId: string, @Body() dto: any) {
    return this.scheduleService.markLeave(doctorId, dto);
  }
}
