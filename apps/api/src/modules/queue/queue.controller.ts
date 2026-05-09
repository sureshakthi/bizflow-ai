import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('doctor/:doctorId')
  getQueueByDoctor(@Param('doctorId') doctorId: string) {
    return this.queueService.getQueueByDoctor(doctorId);
  }

  @Get('status/:tokenId')
  getQueueStatus(@Param('tokenId') tokenId: string) {
    return this.queueService.getQueueStatus(tokenId);
  }

  @Patch(':tokenId/next')
  callNext(@Param('tokenId') tokenId: string) {
    return this.queueService.callNext(tokenId);
  }

  @Patch(':tokenId/skip')
  skipPatient(@Param('tokenId') tokenId: string) {
    return this.queueService.skipPatient(tokenId);
  }

  @Patch(':tokenId/complete')
  completePatient(@Param('tokenId') tokenId: string) {
    return this.queueService.completePatient(tokenId);
  }

  @Get('tv-display')
  getTvDisplay() {
    return this.queueService.getTvDisplayData();
  }
}
