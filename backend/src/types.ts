// src/types.ts
import { Request } from 'express';
import { User } from '@prisma/client';

// Extend the Request object to include the 'user' property after authentication
export interface AuthenticatedRequest extends Request {
  user?: User;
}