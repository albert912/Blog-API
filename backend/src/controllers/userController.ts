// src/controllers/userController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from '../utils/authUtils';

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'READER', // Default role if not provided
      },
    });
    // Don't send the password back
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateAccessToken(user.id, user.role); // Generate JWT
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};