import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PreconsultService } from './preconsult.service';

@Controller('preconsult')
export class PreconsultController {
  constructor(private readonly preconsultService: PreconsultService) {}

  @Post(':tokenId')
  submitForm(@Param('tokenId') tokenId: string, @Body() dto: any) {
    return this.preconsultService.submitForm(tokenId, dto);
  }

  @Get(':tokenId')
  getForm(@Param('tokenId') tokenId: string) {
    return this.preconsultService.getForm(tokenId);
  }

  @Get('patient/:patientId/history')
  getFormHistory(@Param('patientId') patientId: string) {
    return this.preconsultService.getFormHistory(patientId);
  }
}
