// Shared API helpers for prompt history routes
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Authenticate user from request Authorization header
 * Returns authenticated user or throws error
 */
export async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}

/**
 * Handle API errors consistently
 */
export function handleError(error: any) {
  console.error('API Error:', error);

  const message = error.message || 'Internal server error';
  const status = error.status || 500;

  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Create error with status code
 */
export function createError(message: string, status: number = 400) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}
