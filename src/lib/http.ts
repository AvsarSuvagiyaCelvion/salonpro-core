import { NextResponse } from 'next/server';

/**
 * Standard server error response.
 * Logs full diagnostic details to server console and returns a sanitized generic error message to clients.
 */
export function serverError(err: unknown, context?: string): NextResponse {
  console.error(`[API Error] ${context || 'Unknown context'}:`, err);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}

