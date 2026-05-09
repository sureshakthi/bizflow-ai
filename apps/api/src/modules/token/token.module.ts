import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
