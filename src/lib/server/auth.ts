import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export type AuthUser = { id: string; email: string; role: Role };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const token = getToken(req);
  if (!token) throw new ApiError(401, 'Authentication required');
  const user = verifyToken(token);
  if (!user) throw new ApiError(401, 'Invalid or expired token');
  return user;
}

export function requireOwner(user: AuthUser): void {
  if (user.role !== 'OWNER') throw new ApiError(403, 'Owner access required');
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
