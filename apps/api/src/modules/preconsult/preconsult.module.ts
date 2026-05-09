import { Module } from '@nestjs/common';
import { PreconsultController } from './preconsult.controller';
import { PreconsultService } from './preconsult.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreconsultController],
  providers: [PreconsultService],
  exports: [PreconsultService],
})
export class PreconsultModule {}
