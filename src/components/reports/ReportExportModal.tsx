'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Scissors,
  Package,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { exportToCSV, exportToPDF, ExportColumn, SummaryKPI } from '@/lib/export-utils';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'owner' | 'admin';
  salonName?: string;
}

type PeriodType = 'today' | '7d' | 'month' | 'custom' | 'all';

interface ReportConfig {
  id: string;
  label: string;
  icon: any;
  description: string;
  columns: ExportColumn[];
  getKPIs?: (data: any[]) => SummaryKPI[];
}

export default function ReportExportModal({
  isOpen,
  onClose,
  role,
  salonName = 'SalonPro',
}: ReportExportModalProps) {
  // Preset report configurations
  const ownerReports: ReportConfig[] = [
    {
      id: 'invoices',
      label: 'Invoices & Sales',
      icon: DollarSign,
      description: 'Daily revenue, invoice numbers, taxes, payment modes & balances',
      columns: [
        { header: 'Invoice #', key: 'number', width: 28 },
        {
          header: 'Date',
          key: 'created_at',
          width: 28,
          formatter: (v) =>
            v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        },
        { header: 'Customer', key: 'customer_name', width: 34 },
        { header: 'Mobile', key: 'customer_mobile', width: 26 },
        { header: 'Subtotal (₹)', key: 'subtotal', align: 'right', width: 26, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Tax (₹)', key: 'tax_amount', align: 'right', width: 20, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Total (₹)', key: 'total', align: 'right', width: 26, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Paid (₹)', key: 'paid_amount', align: 'right', width: 26, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Due (₹)', key: 'due_amount', align: 'right', width: 22, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Mode', key: 'payment_method', width: 22 },
        { header: 'Status', key: 'status', align: 'center', width: 20 },
      ],
      getKPIs: (data) => {
        const total = data.reduce((sum, r) => sum + Number(r.total || 0), 0);
        const paid = data.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
        const due = data.reduce((sum, r) => sum + Number(r.due_amount || 0), 0);
        return [
          { label: 'Total Invoices', value: data.length },
          { label: 'Total Billed', value: `₹${Math.round(total).toLocaleString('en-IN')}` },
          { label: 'Total Collected', value: `₹${Math.round(paid).toLocaleString('en-IN')}` },
          { label: 'Total Outstanding', value: `₹${Math.round(due).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'staff',
      label: 'Staff Performance',
      icon: Users,
      description: 'Stylist sessions, services revenue, product sales & commissions',
      columns: [
        { header: 'Staff Name', key: 'name', width: 40 },
        { header: 'Role', key: 'role_title', width: 30 },
        { header: 'Sessions', key: 'sessions_count', align: 'center', width: 22 },
        { header: 'Service Rev (₹)', key: 'services_revenue', align: 'right', width: 34, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        { header: 'Product Rev (₹)', key: 'products_revenue', align: 'right', width: 34, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        { header: 'Total Rev (₹)', key: 'total_revenue', align: 'right', width: 34, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        { header: 'Commission (₹)', key: 'total_commission', align: 'right', width: 34, formatter: (v) => `₹${Number(v).toFixed(2)}` },
      ],
      getKPIs: (data) => {
        const rev = data.reduce((sum, r) => sum + Number(r.total_revenue || 0), 0);
        const comm = data.reduce((sum, r) => sum + Number(r.total_commission || 0), 0);
        return [
          { label: 'Active Staff', value: data.length },
          { label: 'Generated Revenue', value: `₹${Math.round(rev).toLocaleString('en-IN')}` },
          { label: 'Total Commission', value: `₹${Math.round(comm).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'customers',
      label: 'Customer Retention',
      icon: Users,
      description: 'Client roster, appointment frequency, lifetime spend & last visits',
      columns: [
        { header: 'Customer Name', key: 'name', width: 45 },
        { header: 'Mobile', key: 'mobile', width: 32 },
        { header: 'Visits', key: 'total_appointments', align: 'center', width: 22 },
        { header: 'Lifetime Spend (₹)', key: 'total_spent', align: 'right', width: 38, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        {
          header: 'Last Visit',
          key: 'last_visit',
          width: 32,
          formatter: (v) =>
            v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never',
        },
      ],
      getKPIs: (data) => {
        const totalSpent = data.reduce((sum, r) => sum + Number(r.total_spent || 0), 0);
        return [
          { label: 'Total Clients', value: data.length },
          { label: 'Total Lifetime Value', value: `₹${Math.round(totalSpent).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'services',
      label: 'Services Breakdown',
      icon: Scissors,
      description: 'Catalog popularity, duration, times booked & service revenue',
      columns: [
        { header: 'Service Name', key: 'name', width: 45 },
        { header: 'Category', key: 'category', width: 35 },
        { header: 'Price (₹)', key: 'price', align: 'right', width: 25, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        { header: 'Duration (m)', key: 'duration_minutes', align: 'center', width: 25 },
        { header: 'Bookings', key: 'times_booked', align: 'center', width: 25 },
        { header: 'Revenue (₹)', key: 'total_revenue', align: 'right', width: 35, formatter: (v) => `₹${Number(v).toFixed(2)}` },
      ],
      getKPIs: (data) => {
        const totalRev = data.reduce((sum, r) => sum + (Number(r.total_revenue) || 0), 0);
        const totalBookings = data.reduce((sum, r) => sum + (Number(r.times_booked) || 0), 0);
        return [
          { label: 'Active Services', value: data.length },
          { label: 'Total Bookings', value: totalBookings },
          { label: 'Service Revenue', value: `₹${Math.round(totalRev).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'products',
      label: 'Product Inventory',
      icon: Package,
      description: 'Stock levels, retail prices, units sold & retail revenue',
      columns: [
        { header: 'Product Name', key: 'name', width: 45 },
        { header: 'Brand', key: 'brand', width: 32 },
        { header: 'Retail Price (₹)', key: 'retail_price', align: 'right', width: 28, formatter: (v) => `₹${Number(v).toFixed(2)}` },
        { header: 'In Stock', key: 'stock', align: 'center', width: 22 },
        { header: 'Units Sold', key: 'units_sold', align: 'center', width: 22 },
        { header: 'Sales Rev (₹)', key: 'total_revenue', align: 'right', width: 32, formatter: (v) => `₹${Number(v).toFixed(2)}` },
      ],
      getKPIs: (data) => {
        const totalRev = data.reduce((sum, r) => sum + (Number(r.total_revenue) || 0), 0);
        const totalSold = data.reduce((sum, r) => sum + (Number(r.units_sold) || 0), 0);
        return [
          { label: 'Catalog SKUs', value: data.length },
          { label: 'Units Sold', value: totalSold },
          { label: 'Retail Sales', value: `₹${Math.round(totalRev).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'appointments',
      label: 'Appointments Log',
      icon: Calendar,
      description: 'Bookings timetable, clients, scheduled services, stylists & status',
      columns: [
        {
          header: 'Date & Time',
          key: 'starts_at',
          width: 38,
          formatter: (v) =>
            v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-',
        },
        { header: 'Client', key: 'customer_name', width: 36 },
        { header: 'Phone', key: 'customer_mobile', width: 28 },
        { header: 'Service', key: 'service_name', width: 42 },
        { header: 'Stylist', key: 'staff_name', width: 32 },
        { header: 'Price (₹)', key: 'service_price', align: 'right', width: 26, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Status', key: 'status', align: 'center', width: 22 },
      ],
      getKPIs: (data) => {
        const totalValue = data.reduce((sum, r) => sum + (Number(r.service_price) || 0), 0);
        return [
          { label: 'Total Appointments', value: data.length },
          { label: 'Estimated Value', value: `₹${Math.round(totalValue).toLocaleString('en-IN')}` },
        ];
      },
    },
  ];

  const adminReports: ReportConfig[] = [
    {
      id: 'salons',
      label: 'Salons Directory',
      icon: Building2,
      description: 'Master list of registered salons, owner contacts, plans & total GMV',
      columns: [
        { header: 'Salon Name', key: 'salon_name', width: 38 },
        { header: 'Owner Name', key: 'owner_name', width: 28 },
        { header: 'Owner Email', key: 'owner_email', width: 40 },
        { header: 'Phone', key: 'phone', width: 24 },
        { header: 'Address', key: 'address', width: 32 },
        { header: 'Plan', key: 'plan_name', width: 24 },
        { header: 'Status', key: 'status', align: 'center', width: 18 },
        { header: 'Staff', key: 'staff_count', align: 'center', width: 16 },
        { header: 'Clients', key: 'customer_count', align: 'center', width: 16 },
        { header: 'Total GMV (₹)', key: 'total_revenue', align: 'right', width: 30, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
      ],
      getKPIs: (data) => {
        const totalGmv = data.reduce((sum, r) => sum + (Number(r.total_revenue) || 0), 0);
        return [
          { label: 'Total Salons', value: data.length },
          { label: 'Total Platform GMV', value: `₹${Math.round(totalGmv).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'subscriptions',
      label: 'SaaS Subscriptions',
      icon: DollarSign,
      description: 'Razorpay billing transactions, plan renewals & MRR revenue',
      columns: [
        { header: 'Salon', key: 'salon_name', width: 38 },
        { header: 'Plan Name', key: 'plan_name', width: 28 },
        { header: 'Interval', key: 'billing_interval', width: 24 },
        { header: 'Amount (₹)', key: 'amount', align: 'right', width: 28, formatter: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
        { header: 'Payment ID', key: 'razorpay_payment_id', width: 45 },
        {
          header: 'Date',
          key: 'created_at',
          width: 30,
          formatter: (v) =>
            v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        },
        { header: 'Status', key: 'status', align: 'center', width: 20 },
      ],
      getKPIs: (data) => {
        const totalPaid = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        return [
          { label: 'Total Payments', value: data.length },
          { label: 'Total Billed Amount', value: `₹${Math.round(totalPaid).toLocaleString('en-IN')}` },
        ];
      },
    },
    {
      id: 'overview',
      label: 'Platform Overview',
      icon: BarChart3,
      description: 'Executive snapshot of platform salons, appointments, clients & GMV',
      columns: [
        { header: 'Platform Metric', key: 'metric', width: 55 },
        { header: 'Metric Value', key: 'value', align: 'right', width: 45, formatter: (v) => typeof v === 'number' ? v.toLocaleString('en-IN') : String(v) },
      ],
    },
  ];

  const reportsList = role === 'admin' ? adminReports : ownerReports;

  const [selectedReportId, setSelectedReportId] = useState<string>(reportsList[0].id);
  const [period, setPeriod] = useState<PeriodType>(role === 'admin' ? 'all' : 'month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (!reportsList.some((r) => r.id === selectedReportId)) {
      setSelectedReportId(reportsList[0].id);
    }
  }, [role, reportsList, selectedReportId]);

  useEffect(() => {
    setPeriod(role === 'admin' ? 'all' : 'month');
  }, [role]);

  useEffect(() => {
    const d = new Date();
    const today = d.toISOString().split('T')[0];
    d.setDate(1);
    const firstDay = d.toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  }, []);

  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeConfig = reportsList.find((r) => r.id === selectedReportId) || reportsList[0];

  // Fetch report records when parameters change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchReportData() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const baseUrl = role === 'admin' ? '/api/admin/export' : '/api/export';
        let queryParams = `type=${selectedReportId}&period=${period}`;

        if (period === 'custom') {
          queryParams += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(`${baseUrl}?${queryParams}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch report data.');
        }

        const json = await res.json();
        if (isMounted) {
          setFetchedData(json.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Error loading report.');
          setFetchedData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, role, selectedReportId, period, startDate, endDate]);

  if (!isOpen) return null;

  function getDateRangeLabel(): string {
    if (period === 'today') return 'Today';
    if (period === '7d') return 'Last 7 Days';
    if (period === 'month') return 'This Month';
    if (period === 'all') return 'All Time';
    return `${startDate} to ${endDate}`;
  }

  function handleDownloadCSV() {
    const filename = `${salonName.replace(/[^a-zA-Z0-9]/g, '_')}_${activeConfig.id}_${period}_${new Date().toISOString().split('T')[0]}`;
    const kpis = activeConfig.getKPIs ? activeConfig.getKPIs(fetchedData) : undefined;
    exportToCSV(filename, activeConfig.columns, fetchedData, {
      title: activeConfig.label,
      subtitle: activeConfig.description,
      salonName,
      dateRangeText: getDateRangeLabel(),
      summaryKPIs: kpis,
    });
  }

  async function handleDownloadPDF() {
    const filename = `${salonName.replace(/[^a-zA-Z0-9]/g, '_')}_${activeConfig.id}_${period}_${new Date().toISOString().split('T')[0]}`;
    const kpis = activeConfig.getKPIs ? activeConfig.getKPIs(fetchedData) : undefined;

    await exportToPDF({
      title: activeConfig.label,
      subtitle: activeConfig.description,
      salonName,
      dateRangeText: getDateRangeLabel(),
      columns: activeConfig.columns,
      data: fetchedData,
      summaryKPIs: kpis,
      filename,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#10141F] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50 dark:bg-[#141926]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4A77F]/20 text-[#B8905F] dark:text-[#D4A77F]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Export Reports (CSV & PDF)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {salonName} · Professional downloadable business analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Report Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              Select Report Dataset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {reportsList.map((rep) => {
                const Icon = rep.icon;
                const isSelected = selectedReportId === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReportId(rep.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#D4A77F] bg-[#D4A77F]/10 dark:bg-[#D4A77F]/15 shadow-sm'
                        : 'border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#141926]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 ${
                        isSelected ? 'bg-[#D4A77F] text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {rep.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {rep.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Range Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              Time Period Filter
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' },
              ].map((p) => {
                const isSelected = period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id as PeriodType)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#D4A77F] bg-[#D4A77F] text-black font-semibold'
                        : 'border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#141926]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Picker */}
            {period === 'custom' && (
              <div className="mt-3.5 flex flex-wrap items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Live Data Preview Box */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#141926]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 text-[#D4A77F] animate-spin" />
              ) : errorMsg ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {loading
                    ? 'Loading records from database...'
                    : errorMsg
                    ? errorMsg
                    : `${fetchedData.length} record(s) ready for export`}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Dataset: {activeConfig.label} · Period: {getDateRangeLabel()}
                </div>
              </div>
            </div>

            {/* Quick KPI pill */}
            {!loading && fetchedData.length > 0 && activeConfig.getKPIs && (
              <div className="hidden sm:flex items-center gap-2">
                {activeConfig.getKPIs(fetchedData).slice(0, 1).map((kpi, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#D4A77F]/15 text-[#B8905F] dark:text-[#D4A77F] border border-[#D4A77F]/30"
                  >
                    {kpi.label}: {kpi.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50 dark:bg-[#141926]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {/* Download CSV */}
            <button
              onClick={handleDownloadCSV}
              disabled={loading || fetchedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Download CSV</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={loading || fetchedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#D4A77F] hover:bg-[#B8905F] text-black shadow-md shadow-[#D4A77F]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileText className="w-4 h-4 text-black" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
