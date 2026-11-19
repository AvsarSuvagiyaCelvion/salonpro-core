'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  CreditCard,
  Percent,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Printer,
  Download,
  Plus,
  Trash2,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Tag,
  Wallet,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import DonutDistributionChart from '@/components/charts/DonutDistributionChart';
import BarComparisonChart from '@/components/charts/BarComparisonChart';
import ReportExportModal from '@/components/reports/ReportExportModal';
import { showToast } from '@/lib/toast';

interface PaymentMethodStat {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface StaffReportItem {
  id: string;
  name: string;
  roleTitle: string | null;
  sessions: number;
  servicesRevenue: number;
  productsRevenue: number;
  totalRevenue: number;
  serviceCommissionPct: number;
  productCommissionPct: number;
  commissionEarned: number;
}

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  payment_mode: string;
  notes: string | null;
  expense_date: string;
  created_at: string;
}

interface ReportsData {
  period: string;
  canViewCommission?: boolean;
  overview: {
    totalRevenue: number;
    totalExpenses?: number;
    netProfit?: number;
    expenseCount?: number;
    totalSessions: number;
    avgSessionValue: number;
    paymentMethods: PaymentMethodStat[];
    paymentStatuses: {
      paid: { count: number; amount: number };
      partial: { count: number; amount: number };
      pending: { count: number; amount: number };
    };
  };
  staffReport: StaffReportItem[];
}

const EXPENSE_CATEGORIES = [
  'Supplies',
  'Refreshments',
  'Laundry',
  'Utilities & Bills',
  'Staff Meals',
  'Salon Maintenance',
  'Other',
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'expenses'>('overview');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Expenses Tab State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Add Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Supplies');
  const [expAmount, setExpAmount] = useState('');
  const [expMode, setExpMode] = useState('cash');
  const [expNotes, setExpNotes] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Global commission adjustment inputs for simulator
  const [globalServiceCommPct, setGlobalServiceCommPct] = useState<number>(10);
  const [globalProductCommPct, setGlobalProductCommPct] = useState<number>(5);
  const [useCustomCommissionRates, setUseCustomCommissionRates] = useState<boolean>(false);

  async function loadReports() {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?period=${period}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses() {
    try {
      setExpensesLoading(true);
      let url = `/api/expenses?category=${selectedExpenseCategory}`;
      if (period === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        url += `&startDate=${todayStr}&endDate=${todayStr}`;
      } else if (period === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        url += `&startDate=${d.toISOString().split('T')[0]}`;
      } else if (period === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        url += `&startDate=${d.toISOString().split('T')[0]}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.expenses || []);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    if (activeTab === 'expenses') {
      loadExpenses();
    }
  }, [period, activeTab, selectedExpenseCategory]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expTitle.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }
    const val = Number(expAmount);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    try {
      setSubmittingExpense(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expTitle,
          category: expCategory,
          amount: val,
          paymentMode: expMode,
          notes: expNotes,
          expenseDate: expDate,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to record expense');

      showToast('Expense recorded successfully!', 'success');
      setExpTitle('');
      setExpAmount('');
      setExpNotes('');
      setAddExpenseModalOpen(false);
      // Reload both data
      loadReports();
      loadExpenses();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingExpense(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      setDeletingExpenseId(id);
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      showToast('Expense record deleted', 'success');
      loadReports();
      loadExpenses();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeletingExpenseId(null);
    }
  }

  // Calculate reactive staff commission rows
  const staffRows = (data?.staffReport || []).map((st) => {
    const svcPct = useCustomCommissionRates
      ? globalServiceCommPct
      : st.serviceCommissionPct || 10;
    const prodPct = useCustomCommissionRates
      ? globalProductCommPct
      : st.productCommissionPct || 5;

    const rawComm =
      ((Number(st.servicesRevenue) || 0) * (Number(svcPct) || 0)) / 100 +
      ((Number(st.productsRevenue) || 0) * (Number(prodPct) || 0)) / 100;
    const commission = isNaN(rawComm) ? 0 : Math.round(rawComm);

    return {
      ...st,
      activeServicePct: svcPct,
      activeProductPct: prodPct,
      calculatedCommission: commission,
    };
  });

  const totalStaffCommissionPayout = staffRows.reduce(
    (sum, st) => sum + (Number(st.calculatedCommission) || 0),
    0
  );
  const totalStaffRevenue = staffRows.reduce((sum, st) => sum + (Number(st.totalRevenue) || 0), 0);
  const totalStaffSessions = staffRows.reduce((sum, st) => sum + (Number(st.sessions) || 0), 0);

  const totalGrossRev = Number(data?.overview?.totalRevenue) || 0;
  const totalExp = Number(data?.overview?.totalExpenses) || 0;
  const netProfit = totalGrossRev - totalExp;

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Financial & Daily P&L Reports
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time daily sales, petty cash expenses, net profit in hand, and staff commission calculations
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1 sm:pb-0">
          <div className="bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] p-1 rounded-2xl flex shadow-sm shrink-0">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  period === p.id
                    ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAddExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            title="Record Daily Expense"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            title="Export CSV and PDF Reports"
          >
            <Download className="w-3.5 h-3.5 text-[#080B12]" />
            <span>Export</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-2xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white shadow-sm print:hidden shrink-0 cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-neutral-200 dark:border-[#2A2F3A] overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-px touch-scroll">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 sm:pb-3 px-3 sm:px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#D4A77F] text-[#D4A77F]'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview & Net P&L</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 sm:pb-3 px-3 sm:px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-[#D4A77F] text-[#D4A77F]'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Daily Expenses ({data?.overview.expenseCount || expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 sm:pb-3 px-3 sm:px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'staff'
              ? 'border-[#D4A77F] text-[#D4A77F]'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Staff Commissions</span>
        </button>
      </div>

      {/* ================= 4-KPI SUMMARY BAR ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gross Revenue */}
        <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
              Gross Sales
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white mt-2">
            {loading ? '...' : `₹${(totalGrossRev || 0).toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-1">
            Total settled client payments
          </p>
        </div>

        {/* 2. Total Daily Expenses */}
        <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
              Daily Expenses
            </span>
            <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Receipt className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {loading ? '...' : `₹${(totalExp || 0).toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-1">
            Tea, laundry, supplies & petty cash
          </p>
        </div>

        {/* 3. Net Cash Profit In Hand */}
        <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Net Profit
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              In Hand
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {loading ? '...' : `₹${(netProfit || 0).toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-1">
            Gross Sales minus all recorded expenses
          </p>
        </div>

        {/* 4. Completed Sessions */}
        <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
              Appointments
            </span>
            <span className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white mt-2">
            {loading ? '...' : (data?.overview?.totalSessions || 0)}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            Avg ticket: ₹{data?.overview?.avgSessionValue || 0}
          </p>
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW & PAYMENT BREAKDOWN ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Payment Method */}
            <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
              <h3 className="font-bold text-base text-[#1F2937] dark:text-white mb-1">
                Collections by Payment Mode
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#A0A8B8] mb-4">
                Cash vs Direct UPI vs Swipe Card breakdown
              </p>

              <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-[#10141F] border border-neutral-100 dark:border-[#2A2F3A] mb-5">
                <DonutDistributionChart
                  size={160}
                  thickness={22}
                  data={(data?.overview.paymentMethods || []).map((m) => ({
                    label: m.method.toUpperCase(),
                    value: m.amount,
                    color: m.method.toLowerCase() === 'cash' ? '#10B981' : m.method.toLowerCase() === 'upi' ? '#8B5CF6' : '#3B82F6',
                  }))}
                />
              </div>

              <div className="space-y-2.5">
                {(data?.overview.paymentMethods || []).map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 dark:border-[#2A2F3A]">
                    <span className="font-bold uppercase">{m.method}</span>
                    <div className="text-right">
                      <strong className="text-sm">₹{(m.amount || 0).toLocaleString('en-IN')}</strong>
                      <span className="text-[11px] text-neutral-400 ml-2">({m.percentage || 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Profit & Loss Summary */}
            <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1F2937] dark:text-white mb-1">
                  Profit & Loss Statement (P&L)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-[#A0A8B8] mb-6">
                  Clear accounting overview for selected period ({period})
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">Total Collections (+)</span>
                      <span className="text-[11px] text-neutral-500">Service + Product Sales</span>
                    </div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{(totalGrossRev || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">Total Expenses (-)</span>
                      <span className="text-[11px] text-neutral-500">Petty Cash & Salon Supplies</span>
                    </div>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      -₹{(totalExp || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#D4A77F]/10 border-2 border-[#D4A77F] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#8C5E2E] dark:text-[#D4A77F] block">Net Profit Realized (=)</span>
                      <span className="text-[11px] text-neutral-500">Actual Cash In Hand</span>
                    </div>
                    <span className="text-2xl font-black text-[#8C5E2E] dark:text-[#D4A77F]">
                      ₹{(netProfit || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="w-full py-3 rounded-2xl bg-neutral-100 dark:bg-[#1C2230] hover:bg-neutral-200 dark:hover:bg-[#2A2F3A] text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Detailed Expenses Breakdown ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DAILY EXPENSES ================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#141926] p-4 rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-neutral-500 shrink-0">Category:</span>
              <button
                onClick={() => setSelectedExpenseCategory('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                  selectedExpenseCategory === 'all'
                    ? 'bg-[#D4A77F] text-[#080B12] font-bold'
                    : 'bg-neutral-100 dark:bg-[#1C2230] text-neutral-600 dark:text-neutral-300'
                }`}
              >
                All Categories
              </button>
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedExpenseCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                    selectedExpenseCategory === cat
                      ? 'bg-[#D4A77F] text-[#080B12] font-bold'
                      : 'bg-neutral-100 dark:bg-[#1C2230] text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAddExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          </div>

          {/* Expenses Table */}
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] overflow-hidden shadow-xs">
            {expensesLoading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading daily expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="py-14 text-center px-4">
                <Receipt className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No Expenses Recorded</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Record your daily salon petty cash expenses (tea, laundry, cleaning, supplies) to compute your accurate net cash profit!
                </p>
                <button
                  onClick={() => setAddExpenseModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer hover:bg-amber-700"
                >
                  + Add First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Expense Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#1C2230]/50 transition-colors">
                        <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                          {exp.expense_date}
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-neutral-900 dark:text-white font-semibold block">{exp.title}</strong>
                          {exp.notes && <span className="text-[10px] text-neutral-400">{exp.notes}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1C2230] text-[10px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase font-bold text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md ${
                            exp.payment_mode === 'cash' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            {exp.payment_mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-sm text-amber-600 dark:text-amber-400">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={deletingExpenseId === exp.id}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete expense"
                          >
                            {deletingExpenseId === exp.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: STAFF COMMISSIONS ================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Commission Simulator */}
          <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-base text-[#1F2937] dark:text-white">
                  Staff Commission Payout Summary
                </h3>
                <p className="text-xs text-neutral-500 dark:text-[#A0A8B8]">
                  Automated service and product sales commission splits
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Total Commission Payout:</span>
                <div className="text-2xl font-black text-[#D4A77F]">
                  ₹{(totalStaffCommissionPayout || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4 text-center">Sessions</th>
                    <th className="py-3 px-4 text-right">Service Rev</th>
                    <th className="py-3 px-4 text-right">Product Rev</th>
                    <th className="py-3 px-4 text-right">Total Rev</th>
                    <th className="py-3 px-4 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                  {staffRows.map((st) => (
                    <tr key={st.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#1C2230]/50 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-neutral-900 dark:text-white font-semibold block">{st.name}</strong>
                        <span className="text-[10px] text-neutral-400">{st.roleTitle || 'Stylist'}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{st.sessions || 0}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{(st.servicesRevenue || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{(st.productsRevenue || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-white">
                        ₹{(st.totalRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sm text-[#D4A77F]">
                        ₹{(st.calculatedCommission || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DAILY EXPENSE ================= */}
      {addExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#2A2F3A] mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#1F2937] dark:text-white">Record Daily Expense</h3>
              </div>
              <button
                onClick={() => setAddExpenseModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Tea & Coffee, Towel Laundry, Gloves"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="e.g. 350"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-bold text-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={expMode}
                    onChange={(e) => setExpMode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none"
                  >
                    <option value="cash">Cash (Counter Cash)</option>
                    <option value="upi">UPI (GPay / PhonePe)</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional detail or receipt reference"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddExpenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#1C2230] text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingExpense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      <ReportExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        role="owner"
      />
    </div>
  );
}
