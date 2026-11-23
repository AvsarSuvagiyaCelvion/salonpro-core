import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ThemeToggle from '@/components/landing/ThemeToggle';
import {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  verifySessionToken,
  verifyCustomerSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth';
import PrintReceiptButton from '@/components/receipt/PrintReceiptButton';
import { generateUpiQrDataUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl, buildUpiPayUrl } from '@/lib/upi';
import { QrCode, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Tax Invoice - SalonPro Luxury Billing',
  description: 'Verified Commercial Digital Salon Invoice & Tax Receipt',
};

function formatFullMobile(mobile: string | null | undefined): string {
  if (!mobile) return 'N/A';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return mobile;
}

export default async function PublicBillPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const decodedNumber = decodeURIComponent(number);

  // Query invoice by unguessable receipt_token or sequential invoice number
  const invRes = await query(
    `SELECT i.*, 
            s.name as salon_name, s.address as salon_address, s.phone as salon_phone, s.logo_url as salon_logo_url,
            s.upi_id as salon_upi_id, s.upi_number as salon_upi_number, s.upi_qr_url as salon_upi_qr_url,
            c.id as customer_uuid, c.name as customer_name, c.mobile as customer_mobile
     FROM invoices i
     JOIN salons s ON i.salon_id = s.id
     JOIN customers c ON i.customer_id = c.id
     WHERE (i.receipt_token = $1 OR i.number = $1)
     ORDER BY i.created_at DESC
     LIMIT 1`,
    [decodedNumber]
  );

  if (invRes.rows.length === 0) {
    notFound();
  }

  const invoice = invRes.rows[0];

  // Anti-IDOR Security: If accessed via sequential invoice number instead of the unguessable receipt_token,
  // require authenticated caller to be the salon owner/staff, the customer, or platform admin.
  const isDirectTokenMatch = invoice.receipt_token && decodedNumber === invoice.receipt_token;
  if (!isDirectTokenMatch) {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(COOKIE_NAME)?.value;
    const customerToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    let isAuthorized = false;

    if (ownerToken) {
      const ownerSession = await verifySessionToken(ownerToken);
      if (ownerSession && ownerSession.salonId === invoice.salon_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && customerToken) {
      const custSession = await verifyCustomerSessionToken(customerToken);
      if (custSession && custSession.customerId === invoice.customer_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && adminToken) {
      const adminSession = await verifyAdminSessionToken(adminToken);
      if (adminSession) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      notFound();
    }
  }

  // Fetch session items
  let items: any[] = [];
  if (invoice.session_id) {
    const itemsRes = await query(
      `SELECT kind, name, qty, unit_price, staff_id 
       FROM session_items 
       WHERE session_id = $1`,
      [invoice.session_id]
    );
    items = itemsRes.rows;
  }

  // Fetch payments
  const payRes = await query(
    `SELECT amount, method, reference, created_at 
     FROM payments 
     WHERE invoice_id = $1 
     ORDER BY created_at ASC`,
    [invoice.id]
  );
  const payments = payRes.rows;

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAmount = Number(invoice.total) || 0;
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  // Inclusive GST calculation (18% total: 9% CGST + 9% SGST)
  const totalTax = totalAmount > 0 ? (totalAmount * 18) / 118 : 0;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const taxableSubtotal = Math.max(0, totalAmount - totalTax);

  const status =
    dueAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';

  // Pre-generate dynamic UPI payment QR if balance is due
  let clientUpiQrDataUrl: string | null = null;
  const salonUpiId = invoice.salon_upi_id;
  if (dueAmount > 0 && salonUpiId) {
    try {
      clientUpiQrDataUrl = await generateUpiQrDataUrl({
        upiId: salonUpiId,
        name: invoice.salon_name || 'Salon',
        amount: dueAmount,
        note: `Invoice ${invoice.number}`,
      });
    } catch {
      clientUpiQrDataUrl = null;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 flex flex-col justify-start items-center print:bg-white print:p-0 transition-colors duration-200 py-6 sm:py-10 px-3 sm:px-6">
      
      {/* Universal Top Navigation Header (Hidden on Hardware Print) */}
      <header className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 mb-6 print:hidden">
        <Link href="/portal" className="flex items-center gap-2 group min-w-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            SP
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white block leading-tight">
              SalonPro <span className="font-normal text-xs text-neutral-500">Official Invoice</span>
            </span>
            <span className="text-[10px] text-neutral-400 block -mt-0.5 font-mono">
              Verified Digital Receipt
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <span>My Portal ➔</span>
          </Link>
        </div>
      </header>

      {/* Main Luxury A4 Invoice Document Container */}
      <div
        id="invoice-receipt-card"
        className="w-full max-w-3xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-none overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none p-6 sm:p-10 space-y-6"
      >
        {/* ================= 1. HEADER SECTION ================= */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          {/* Left: Salon Branding */}
          <div className="flex items-start gap-4">
            {invoice.salon_logo_url ? (
              <div className="w-14 h-14 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.salon_logo_url}
                  alt={invoice.salon_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xl shrink-0">
                {(invoice.salon_name?.charAt(0) || 'S').toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                {invoice.salon_name}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                {invoice.salon_address || 'Premium Hair, Beauty & Wellness Studio'}
              </p>
              {invoice.salon_phone && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                  Tel: {invoice.salon_phone}
                </p>
              )}
            </div>
          </div>

          {/* Right: Tax Invoice Title & Metadata */}
          <div className="sm:text-right space-y-2">
            <div className="inline-block">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-400 block">
                Official Document
              </span>
              <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                TAX INVOICE
              </span>
            </div>

            <div className="text-xs space-y-0.5 text-neutral-600 dark:text-neutral-300 font-mono">
              <div>
                <span className="text-neutral-400">Invoice No: </span>
                <span className="font-bold text-neutral-900 dark:text-white">{invoice.number}</span>
              </div>
              <div>
                <span className="text-neutral-400">Date: </span>
                <span>
                  {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' · '}
                  {new Date(invoice.created_at).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Minimalist Status Badge */}
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border ${
                  status === 'PAID'
                    ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white bg-neutral-100 dark:bg-neutral-800'
                    : 'border-neutral-400 text-neutral-600 dark:text-neutral-300 bg-transparent'
                }`}
              >
                {status === 'PAID' ? 'PAID [ ✓ ]' : status === 'PARTIAL' ? 'PARTIAL PAYMENT' : 'PAYMENT DUE'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 2. CLIENT & REFERENCE METADATA CARD ================= */}
        <div className="bg-neutral-50 dark:bg-[#161616] p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Column 1: Customer */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
              Billed To (Customer)
            </span>
            <div className="font-bold text-sm text-neutral-900 dark:text-white">
              {invoice.customer_name}
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {formatFullMobile(invoice.customer_mobile)}
            </div>
          </div>

          {/* Column 2: Reference Details */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
              Reference Details
            </span>
            <div className="text-neutral-700 dark:text-neutral-300">
              <span className="text-neutral-400 font-mono">Customer ID: </span>
              <span className="font-mono font-medium">
                {invoice.customer_uuid ? invoice.customer_uuid.slice(0, 8).toUpperCase() : 'CUST-WALKIN'}
              </span>
            </div>
            <div className="text-neutral-700 dark:text-neutral-300 mt-0.5">
              <span className="text-neutral-400 font-mono">Booking Ref: </span>
              <span className="font-mono font-medium">
                {invoice.session_id ? `#SES-${invoice.session_id.slice(0, 6).toUpperCase()}` : 'POS Direct'}
              </span>
            </div>
          </div>

          {/* Column 3: Operational Context */}
          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
              Operational Context
            </span>
            <div className="text-neutral-700 dark:text-neutral-300">
              <span className="text-neutral-400">Attended By: </span>
              <span className="font-medium text-neutral-900 dark:text-white">Salon Stylist Team</span>
            </div>
            <div className="text-neutral-700 dark:text-neutral-300 mt-0.5">
              <span className="text-neutral-400">Payment: </span>
              <span className="font-semibold uppercase text-neutral-900 dark:text-white">
                {payments.length > 0 ? payments[0].method : 'UPI / Cash'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 3. ITEMIZED SERVICES & PRODUCTS TABLE ================= */}
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-t border-b border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Service / Product Description</th>
                  <th className="py-2.5 px-3 w-24 text-center">Type</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-3 text-center text-neutral-400 font-mono">
                      Salon Service & Beauty Styling Session
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-neutral-400 text-xs">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                          {item.kind || 'service'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-neutral-700 dark:text-neutral-300">
                        {item.qty || 1}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                        ₹{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                        ₹{(Number(item.unit_price) * (item.qty || 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 4. SETTLEMENT & FINANCIAL BREAKDOWN ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          
          {/* Left Column: Settlement & UPI QR Code */}
          <div className="space-y-4">
            {dueAmount > 0 && salonUpiId ? (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  <QrCode className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <span>Scan to Settle Balance (UPI)</span>
                </div>

                <div className="flex items-center gap-4">
                  {clientUpiQrDataUrl && (
                    <div className="w-24 h-24 bg-white p-1 rounded-lg border border-neutral-300 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clientUpiQrDataUrl}
                        alt="Pay Balance UPI QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-neutral-900 dark:text-white">
                      Outstanding: ₹{dueAmount.toFixed(2)}
                    </div>
                    <div className="font-mono text-[11px] text-neutral-500">
                      UPI ID: {salonUpiId}
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Scan with Google Pay, PhonePe, Paytm or any UPI App
                    </p>
                  </div>
                </div>

                {/* Direct App Deep Links */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 print:hidden">
                  <a
                    href={buildGPayUrl({
                      upiId: salonUpiId,
                      name: invoice.salon_name || 'Salon',
                      amount: dueAmount,
                      note: `Invoice ${invoice.number}`,
                    })}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-neutral-900"
                  >
                    GPay
                  </a>
                  <a
                    href={buildPhonePeUrl({
                      upiId: salonUpiId,
                      name: invoice.salon_name || 'Salon',
                      amount: dueAmount,
                      note: `Invoice ${invoice.number}`,
                    })}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-neutral-900"
                  >
                    PhonePe
                  </a>
                  <a
                    href={buildPaytmUrl({
                      upiId: salonUpiId,
                      name: invoice.salon_name || 'Salon',
                      amount: dueAmount,
                      note: `Invoice ${invoice.number}`,
                    })}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-neutral-900"
                  >
                    Paytm
                  </a>
                  <a
                    href={buildUpiPayUrl({
                      upiId: salonUpiId,
                      name: invoice.salon_name || 'Salon',
                      amount: dueAmount,
                      note: `Invoice ${invoice.number}`,
                    })}
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Pay</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <span>Payment Settlement Authorization</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Payment for this invoice has been fully authorized and recorded into the salon&apos;s ledger. No further settlement is required.
                </p>
                <div className="font-mono text-[11px] text-neutral-400 pt-1">
                  Verified by SalonPro Cloud ERP Core
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Financial Calculation Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Gross Subtotal</span>
              <span className="font-mono">₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-neutral-900 dark:text-white font-semibold">
                <span>Promotional Discount</span>
                <span className="font-mono">- ₹{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <span>Taxable Value</span>
              <span className="font-mono">₹{taxableSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-neutral-500">
              <span>CGST (9.0%)</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-neutral-500">
              <span>SGST (9.0%)</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>

            {/* Grand Total Black Solid Bar */}
            <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-sm mt-2">
              <span className="tracking-wide">GRAND TOTAL</span>
              <span className="font-mono text-base">₹{totalAmount.toFixed(2)}</span>
            </div>

            {/* Paid vs Due Amount */}
            <div className="flex justify-between items-center pt-2 px-1 text-xs">
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Paid Amount</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                ₹{totalPaid.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center px-1 text-xs font-bold">
              <span className={dueAmount > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}>
                Remaining Balance
              </span>
              <span className="font-mono">
                {dueAmount > 0 ? `₹${dueAmount.toFixed(2)}` : '₹0.00 [ Settled ]'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 5. TERMS & COMMERCIAL FOOTER ================= */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-bold text-neutral-900 dark:text-white">
              Thank you for choosing {invoice.salon_name}.
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Terms: 1. Goods/Services billed are subject to boutique policy. 2. Please retain this invoice for your records.
            </p>
          </div>

          <div className="shrink-0 print:hidden">
            <PrintReceiptButton
              salon={{
                name: invoice.salon_name,
                address: invoice.salon_address,
                phone: invoice.salon_phone,
                logo_url: invoice.salon_logo_url,
                upi_id: invoice.salon_upi_id,
              }}
              invoice={{
                number: invoice.number,
                created_at: invoice.created_at,
                customer_name: invoice.customer_name,
                customer_mobile: invoice.customer_mobile,
                customer_id: invoice.customer_uuid,
                subtotal: invoice.subtotal,
                discount_amount: invoice.discount_amount,
                tax_amount: totalTax,
                total: invoice.total,
              }}
              items={items}
              payments={payments}
              taxableSubtotal={taxableSubtotal}
              cgst={cgst}
              sgst={sgst}
              status={status}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
