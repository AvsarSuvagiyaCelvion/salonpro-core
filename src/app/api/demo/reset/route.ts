import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const client = await pool.connect();
  try {
    const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await client.query('BEGIN');
    await client.query(seedSql);
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Demo database reset successfully to pristine sample data!',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
