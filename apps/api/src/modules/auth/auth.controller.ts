import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: { username: string; password: string }) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: { phone: string; otp: string }) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }
}
