import { Controller, Post, Get, Delete, Body, Req, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // Webhook verification for Meta
  @Get('webhook')
  verifyWebhook(@Req() req: any) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return 'Forbidden';
  }

  // Incoming message webhook
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.whatsappService.handleIncoming(body);
  }

  // Send message manually (for testing/admin)
  @Post('send')
  sendMessage(@Body() dto: any) {
    return this.whatsappService.sendMessage(dto.phone, dto.message, dto.templateName);
  }

  // DEV ONLY: reset conversation state for a phone number (for testing)
  @Delete('reset-state/:phone')
  async resetState(@Param('phone') phone: string) {
    await this.whatsappService.resetConversation(phone);
    return { status: 'reset', phone };
  }
}
