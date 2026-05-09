import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('tokens')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Post()
  generate(
    @Body()
    body: {
      patientId: string;
      doctorId: string;
      purpose: string;
      deptCode: string;
      priority?: number;
      appointmentId?: string;
    },
  ) {
    return this.tokenService.generateToken(body);
  }

  @Get()
  getTodaysTokens(@Query('doctorId') doctorId?: string) {
    return this.tokenService.getTodaysTokens(doctorId);
  }

  @Get('by-number/:tokenNumber')
  findByTokenNumber(@Param('tokenNumber') tokenNumber: string) {
    return this.tokenService.findByTokenNumber(tokenNumber);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.tokenService.updateStatus(id, body.status);
  }
}
