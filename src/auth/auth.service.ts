// auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as crypto from 'crypto';
import { Twilio } from 'twilio';

@Injectable()
export class AuthService {
  private twilioClient: Twilio;

  constructor(@InjectModel('User') private userModel: Model<User>) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async generateOtp(
    phoneNumber: string,
    expirationMinutes?: number,
  ): Promise<void> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(
      Date.now() + (expirationMinutes || 10) * 60 * 1000,
    ); // Default to 10 minutes if not provided

    await this.userModel.updateOne(
      { phoneNumber },
      { phoneNumber, otp, otpExpires },
      { upsert: true },
    );

    await this.twilioClient.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber });

    if (!user) return false;

    if (user.otp === otp && user.otpExpires > new Date()) {
      await this.userModel.updateOne(
        { phoneNumber },
        { $unset: { otp: '', otpExpires: '' } },
      );
      return true;
    }
    return false;
  }
}
