'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/app');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-[#faf6f8] via-[#f7eef3] to-[#f4e4ed]">
      {/* Top Banner */}
      <div className="fixed top-0 left-0 right-0 bg-[#2a1630] text-pink-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 z-50">
        <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
        <span>SalonPro Cloud ERP · Official Manager & Staff Portal</span>
      </div>

      <div className="w-full max-w-md mt-8">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white shadow-xl shadow-pink-900/20 mb-4 ring-4 ring-pink-100">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2a1630] tracking-tight">
            SalonPro
          </h1>
          <p className="text-sm text-neutral-600 mt-1.5">
            Salon Operating System & Manager Portal
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white/90 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-7 shadow-xl shadow-neutral-900/5">
          <h2 className="text-xl font-bold text-[#2a1630] mb-5">
            Owner Sign In
          </h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Sign in failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white text-neutral-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-xs text-[#b3135b] hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white text-neutral-900"
                />
              </div>

              {showForgotNotice && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>🔑 Password Recovery:</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-800">
                    Salon accounts are managed by the Platform Super Admin. If you forgot your password, please contact{' '}
                    <strong className="font-mono text-amber-950">Adminsalonpro@gmail.com</strong> or your system administrator to issue a secure password reset.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#b3135b] hover:bg-[#960f4c] text-white font-semibold text-sm shadow-lg shadow-[#b3135b]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.99]"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info & Panel Nav */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span className="text-neutral-400">Panel 2 of 3 · Salon ERP</span>
            <span className="text-neutral-400">Branch Manager Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
