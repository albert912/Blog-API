// src/utils/authUtils.ts
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateAccessToken = (userId: string, role: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
};

