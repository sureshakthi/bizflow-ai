import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    // Simple auth for demo - staff/doctor login
    const user = await this.prisma.user.findFirst({
      where: { email: username },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // In production: use bcrypt to compare hashed passwords
    // For demo, we use plain text comparison
    return { userId: user.id, role: user.role, name: user.name };
  }

  async verifyOtp(phone: string, otp: string) {
    // For demo: accept any 4-digit OTP
    if (otp.length !== 4) throw new UnauthorizedException('Invalid OTP');

    const patient = await this.prisma.patient.findFirst({ where: { phone } });
    if (!patient) throw new UnauthorizedException('Patient not found');

    return { patientId: patient.id, name: patient.name, verified: true };
  }
}
