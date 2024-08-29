import {
  Injectable,
  BadRequestException,
  // UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema'; // Importing the User interface/schema
import * as crypto from 'crypto';
import { Twilio } from 'twilio';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';

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

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber });

    if (!user) return false;

    if (user.otp === otp && user.otpExpires > new Date()) {
      // Clear OTP and expiration time after successful verification
      await this.userModel.updateOne(
        { phoneNumber },
        { $unset: { otp: '', otpExpires: '' } },
      );
      return true;
    }
    if (user.otp === otp && user.otpExpires < new Date()) {
      // Clear OTP and expiration time after otp expires
      await this.userModel.updateOne(
        { phoneNumber },
        { $unset: { otp: '', otpExpires: '' } },
      );
    }
    return false;
  }
}
