import { Schema, Document } from 'mongoose';

export interface User extends Document {
  phoneNumber: string;
  otp: string;
  otpExpires: Date;
}

export const UserSchema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
});
