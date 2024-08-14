import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('expirationMinutes') expirationMinutes?: number,
  ): Promise<string> {
    await this.authService.generateOtp(phoneNumber, expirationMinutes);
    return 'OTP sent successfully';
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): Promise<string> {
    const isValid = await this.authService.verifyOtp(phoneNumber, otp);
    if (isValid) {
      return 'OTP verified successfully';
    } else {
      return 'Invalid OTP';
    }
  }
}
