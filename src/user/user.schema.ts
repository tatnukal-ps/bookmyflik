// user.schema.ts
import { Schema, Document } from 'mongoose';

export interface User extends Document {
  phoneNumber: string;
  otp?: string;
  otpExpires?: Date;
  refreshToken?: string; // New field for refresh token
}

export const UserSchema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
  refreshToken: { type: String },
});
