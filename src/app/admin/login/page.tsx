'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Building2, User } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login as Super Admin');
      }

      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const returnUrl = searchParams?.get('returnUrl');
      const targetPath = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/admin';
      window.location.href = targetPath;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col justify-center items-center p-4 selection:bg-[#D4A77F] selection:text-[#080B12] font-sans transition-colors duration-300">
      <div className="max-w-md w-full relative z-10">
        {/* Top Tag & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4A77F]/15 border border-[#D4A77F]/30 text-[#D4A77F] text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4A77F]" />
            <span>Master Platform Admin (Panel 1 of 3)</span>
          </div>
          <h1 className="text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">Super Admin Portal</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-1.5">
            Manage multi-tenant salons, owners, global subscriptions & analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-7 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-sm shadow-md shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating Admin...' : 'Sign In as Super Admin ➔'}
            </button>
          </form>

          {/* Quick Nav to other 2 panels */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8]">
            <Link href="/salon-owner" className="hover:text-[#D4A77F] flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#D4A77F]" />
              <span>Salon Owner Login</span>
            </Link>
            <Link href="/portal" className="hover:text-[#10B981] flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Customer Portal</span>
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] underline">
            ← Back to Marketing Home
          </Link>
        </div>
      </div>
    </div>
  );
}
