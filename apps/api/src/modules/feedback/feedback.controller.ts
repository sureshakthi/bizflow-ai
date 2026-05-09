import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() dto: any) {
    return this.feedbackService.create(dto);
  }

  @Get()
  findAll(@Query('rating') rating?: string) {
    return this.feedbackService.findAll(rating ? parseInt(rating) : undefined);
  }

  @Get('stats')
  getStats() {
    return this.feedbackService.getStats();
  }

  @Get('patient/:patientId')
  getByPatient(@Param('patientId') patientId: string) {
    return this.feedbackService.findByPatient(patientId);
  }
}
