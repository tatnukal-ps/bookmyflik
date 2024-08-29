import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
      throw error;
    }
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ) {
    try {
      const tokens = await this.authService.verifyOtp(phoneNumber, otp);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('OTP verification failed.');
    }
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const accessToken =
        await this.authService.refreshAccessToken(refreshToken);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }
}
