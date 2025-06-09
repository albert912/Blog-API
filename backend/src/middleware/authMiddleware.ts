// src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

dotenv.config();

const prisma = new PrismaClient();

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string, role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.user = user; // Attach the user object to the request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ message: 'Invalid Token.' });
  }
};