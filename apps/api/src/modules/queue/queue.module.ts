import { Module, forwardRef } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WhatsappModule)],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService],
})
export class QueueModule {}
