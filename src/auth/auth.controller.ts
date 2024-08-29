import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body('phoneNumber') phoneNumber: string) {
    try {
      await this.authService.generateOtp(phoneNumber);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { error: error.message };
      }
      throw error; // Re-throw unexpected errors
    }
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
