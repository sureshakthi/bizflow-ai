import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('queries')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  create(@Body() dto: any) {
    return this.queryService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.queryService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryService.findOne(id);
  }

  @Patch(':id/respond')
  respond(@Param('id') id: string, @Body() dto: any) {
    return this.queryService.respond(id, dto);
  }

  @Patch(':id/escalate')
  escalate(@Param('id') id: string, @Body() dto: any) {
    return this.queryService.escalate(id, dto);
  }

  @Get('patient/:patientId')
  getByPatient(@Param('patientId') patientId: string) {
    return this.queryService.findByPatient(patientId);
  }
}
