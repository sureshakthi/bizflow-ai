import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
