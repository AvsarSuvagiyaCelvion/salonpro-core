import { NextResponse } from 'next/server';

/**
 * Standard server error response.
 * Safely inspects Postgres and client-input error codes so that malformed user inputs
 * (e.g. invalid UUIDs, bad date formats, check constraint violations, malformed JSON)
 * return appropriate RFC HTTP 400/409 client errors instead of unhandled 500 crashes.
 */
export function serverError(err: unknown, context?: string): NextResponse {
  console.error(`[API Error] ${context || 'Unknown context'}:`, err);

  const errorObj = err as any;
  const pgCode = errorObj?.code;
  const message = errorObj?.message || '';

  // 1. Postgres 22P02: Invalid text representation (malformed UUIDs, bad integers, SQL syntax in parameters)
  if (pgCode === '22P02' || message.includes('invalid input syntax for type uuid') || message.includes('invalid input syntax for type integer')) {
    return NextResponse.json(
      { error: 'Invalid identifier or parameter format.', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  // 2. Postgres 22007 / 22008: Invalid datetime format or overflow
  if (pgCode === '22007' || pgCode === '22008' || message.includes('invalid input syntax for type timestamp')) {
    return NextResponse.json(
      { error: 'Invalid date or time value.', code: 'INVALID_DATETIME' },
      { status: 400 }
    );
  }

  // 3. SyntaxError: Malformed JSON payload passed in request body
  if (err instanceof SyntaxError || errorObj?.name === 'SyntaxError') {
    return NextResponse.json(
      { error: 'Malformed JSON or invalid request payload.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 4. Postgres 23505: Unique constraint violation (duplicate key)
  if (pgCode === '23505' || message.includes('violates unique constraint')) {
    return NextResponse.json(
      { error: 'A conflicting record already exists.', code: 'CONFLICT' },
      { status: 409 }
    );
  }

  // 5. Postgres 23503: Foreign key violation
  if (pgCode === '23503' || message.includes('violates foreign key constraint')) {
    return NextResponse.json(
      { error: 'Referenced record was not found or is invalid.', code: 'FOREIGN_KEY_VIOLATION' },
      { status: 400 }
    );
  }

  // 6. Postgres 23514: Check constraint violation
  if (pgCode === '23514' || message.includes('violates check constraint')) {
    return NextResponse.json(
      { error: 'Provided data violates validation rules.', code: 'CHECK_VIOLATION' },
      { status: 400 }
    );
  }

  // 7. General unexpected internal error
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.', code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  );
}


