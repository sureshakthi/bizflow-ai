import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { PatientModule } from './modules/patient/patient.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { TokenModule } from './modules/token/token.module';
import { QueueModule } from './modules/queue/queue.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { PreconsultModule } from './modules/preconsult/preconsult.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { LabReportModule } from './modules/lab-report/lab-report.module';
import { QueryModule } from './modules/query/query.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AuthModule } from './modules/auth/auth.module';
import { PriceListModule } from './modules/price-list/price-list.module';
import { OcrModule } from './modules/ocr/ocr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NestScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    PatientModule,
    DoctorModule,
    TokenModule,
    QueueModule,
    AppointmentModule,
    PreconsultModule,
    PrescriptionModule,
    LabReportModule,
    QueryModule,
    FeedbackModule,
    ScheduleModule,
    WhatsappModule,
    PriceListModule,
    OcrModule,
  ],
})
export class AppModule {}
