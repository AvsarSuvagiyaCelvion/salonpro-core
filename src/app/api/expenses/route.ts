import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';

// Static demo expenses for 1-click test-drive showcase
const DEMO_EXPENSES = [
  {
    id: 'exp-demo-1',
    title: 'Client Refreshments & Green Tea',
    category: 'Refreshments',
    amount: 320,
    payment_mode: 'upi',
    notes: 'Beverages for morning client appointments',
    expense_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-demo-2',
    title: 'Fresh Towels Daily Laundry',
    category: 'Laundry',
    amount: 450,
    payment_mode: 'cash',
    notes: '20 clean sterilized towels from laundromat',
    expense_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-demo-3',
    title: 'Salon Floor Disinfectant & Wipes',
    category: 'Maintenance',
    amount: 280,
    payment_mode: 'cash',
    notes: 'Daily hygiene sanitation pack',
    expense_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-demo-4',
    title: 'Disposable Gloves & Neck Strips',
    category: 'Supplies',
    amount: 650,
    payment_mode: 'upi',
    notes: 'Weekly consumable salon supplies restock',
    expense_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner', 'staff']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    // Demo Mode Handler
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const filtered = DEMO_EXPENSES.filter((e) => {
        if (category && category !== 'all' && e.category.toLowerCase() !== category.toLowerCase()) return false;
        if (startDate && e.expense_date < startDate) return false;
        if (endDate && e.expense_date > endDate) return false;
        return true;
      });
      const totalAmount = filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);
      return NextResponse.json({
        success: true,
        expenses: filtered,
        totalExpenses: totalAmount,
        count: filtered.length,
      });
    }

    const conditions: string[] = ['salon_id = $1'];
    const params: any[] = [salonId];

    if (startDate) {
      params.push(startDate);
      conditions.push(`expense_date >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`expense_date <= $${params.length}`);
    }

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`LOWER(category) = LOWER($${params.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const res = await query(
      `SELECT id, title, category, amount, payment_mode, notes, 
              TO_CHAR(expense_date, 'YYYY-MM-DD') as expense_date, 
              created_at
       FROM expenses
       WHERE ${whereClause}
       ORDER BY expense_date DESC, created_at DESC`,
      params
    );

    const expenses = res.rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      expenses,
      totalExpenses: totalAmount,
      count: expenses.length,
    });
  } catch (err: any) {
    return serverError(err, 'fetch expenses');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner', 'staff']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { title, category, amount, paymentMode, notes, expenseDate } = body;

    const cleanTitle = title?.trim();
    const cleanCategory = category?.trim() || 'Supplies';
    const numAmount = Number(amount);
    const cleanMode = paymentMode?.trim().toLowerCase() || 'cash';
    const cleanNotes = notes?.trim() || null;
    const cleanDate = expenseDate?.trim() || new Date().toISOString().split('T')[0];

    if (!cleanTitle || cleanTitle.length === 0) {
      return NextResponse.json({ error: 'Expense title is required' }, { status: 400 });
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid expense amount greater than 0' }, { status: 400 });
    }

    const validModes = ['cash', 'upi', 'card', 'bank_transfer'];
    const finalMode = validModes.includes(cleanMode) ? cleanMode : 'cash';

    // Demo Mode Handler
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const mockExpense = {
        id: `exp-${Date.now()}`,
        title: cleanTitle,
        category: cleanCategory,
        amount: numAmount,
        payment_mode: finalMode,
        notes: cleanNotes,
        expense_date: cleanDate,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        message: 'Expense recorded successfully!',
        expense: mockExpense,
      });
    }

    const insertRes = await query(
      `INSERT INTO expenses (
        salon_id, title, category, amount, payment_mode, notes, expense_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, category, amount, payment_mode, notes, 
                TO_CHAR(expense_date, 'YYYY-MM-DD') as expense_date, 
                created_at`,
      [salonId, cleanTitle, cleanCategory, numAmount, finalMode, cleanNotes, cleanDate]
    );

    const inserted = insertRes.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Expense recorded successfully!',
      expense: {
        ...inserted,
        amount: Number(inserted.amount),
      },
    });
  } catch (err: any) {
    return serverError(err, 'record expense');
  }
}
