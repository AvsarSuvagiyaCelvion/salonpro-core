'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Building2, User } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@salonpro.com');
  const [password, setPassword] = useState('Admin@2136');
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

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-neutral-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 to-purple-600/15 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Top Tag & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Platform Admin (Panel 1 of 3)</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage multi-tenant salons, owners, global subscriptions & analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@salonpro.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Demo Credentials Box */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
              <div className="font-bold text-[11px] uppercase tracking-wider text-amber-400">
                Default Master Admin Credentials:
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>Email: <strong className="text-white">admin@salonpro.com</strong></span>
                <span>Pass: <strong className="text-white">Admin@2136</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Authenticating Admin...' : 'Sign In as Super Admin ➔'}
            </button>
          </form>

          {/* Quick Nav to other 2 panels */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex justify-between text-xs text-neutral-400">
            <Link href="/login" className="hover:text-pink-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Salon Owner Login</span>
            </Link>
            <Link href="/portal" className="hover:text-emerald-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 underline">
            ← Back to Multi-Panel Launchpad
          </Link>
        </div>
      </div>
    </div>
  );
}
