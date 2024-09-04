import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema'; // Importing the User interface/schema
import { LoggerServ as LoggerService } from '../logger/logger.service';
import * as crypto from 'crypto';
import { Twilio } from 'twilio';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private twilioClient: Twilio;

  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async generateOtp(
    phoneNumber: string,
    expirationMinutes: number = 10,
  ): Promise<void> {
    // Find the user with the given phone number
    const existingUser = await this.userModel.findOne({ phoneNumber });

    // Check if the user exists and if a recent OTP request was made
    if (existingUser && existingUser.otpExpires > new Date()) {
      const lastOtpRequested = new Date(
        existingUser.otpExpires.getTime() - expirationMinutes * 60 * 1000,
      );
      const timeSinceLastOtp = Date.now() - lastOtpRequested.getTime();

      // Check if the last OTP was requested within the last 1 minute
      if (timeSinceLastOtp < 60 * 1000) {
        throw new BadRequestException(
          'You can request a new OTP after 1 minute.',
        );
      }
    }

    // Generate a new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Update the user's OTP and expiration time in the database
    await this.userModel.updateOne(
      { phoneNumber },
      { phoneNumber, otp, otpExpires },
      { upsert: true }, // This option creates a new document if no match is found
    );

    // Send the OTP via SMS using Twilio
    await this.twilioClient.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    try {
      this.logger.log(
        `Verifying OTP for phone number: ${phoneNumber} with OTP: ${otp}`,
      );

      const user = await this.userModel.findOne({ phoneNumber, otp });
      if (!user) {
        this.logger.log(`User not found for phone number: ${phoneNumber}`);
        throw new UnauthorizedException('Invalid OTP.');
      }

      this.logger.log(`Fetched user: ${JSON.stringify(user)}`);

      if (user.otpExpires < new Date()) {
        this.logger.log(`OTP expired for phone number: ${phoneNumber}`);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        throw new UnauthorizedException('Expired OTP.');
      }

      // Clear OTP after verification
      user.otp = undefined;
      user.otpExpires = undefined;
      this.logger.log(`Generating tokens`);

      // Generate tokens
      const payload = { phoneNumber: user.phoneNumber };
      this.logger.log(JSON.stringify(payload));
      let accessToken, refreshToken;
      try {
        this.logger.log(`Generating access token`);
        accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        this.logger.log(`Access token generated successfully`);
        refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        this.logger.log(`Refresh token generated successfully`);
      } catch (error) {
        this.logger.error(
          'Error generating tokens',
          error.stack || error.message,
        );
        throw error;
      }

      // Hash the refresh token before saving
      user.refreshToken = await bcrypt.hash(refreshToken, 10);

      await user.save();
      this.logger.log('User saved successfully');

      return { message: 'OTP Verified', accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        'Error during OTP verification',
        error.stack || error.message,
      );
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const { phoneNumber } = this.jwtService.verify(refreshToken);

      const user = await this.userModel.findOne({ phoneNumber });

      if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const payload = { phoneNumber: user.phoneNumber };
      return this.jwtService.sign(payload, { expiresIn: '15m' });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async verifyAccessToken(token: string): Promise<User> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userModel.findOne({
        phoneNumber: decoded.phoneNumber,
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error('Access token verification failed', error.stack);
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
