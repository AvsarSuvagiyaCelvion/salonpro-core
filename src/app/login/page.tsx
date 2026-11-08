'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'avsarsuvagiya968@gmail.com';

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

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Database connection issue. Please check your network or try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      if (typeof window !== 'undefined') {
        if (data.salon) {
          try {
            localStorage.setItem('salonpro_salon_info', JSON.stringify(data.salon));
          } catch {}
        }
        if (data.user) {
          try {
            localStorage.setItem('salonpro_user_info', JSON.stringify(data.user));
          } catch {}
        }
      }

      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const returnUrl = searchParams?.get('returnUrl') || searchParams?.get('from');
      // SEC-03: Safe redirect protection - reject protocol-relative URLs (//evil.com), backslashes, and schemes (javascript:, etc.)
      const isSafeInternalPath =
        returnUrl &&
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') &&
        !returnUrl.includes('\\') &&
        !returnUrl.includes(':');
      const targetPath = isSafeInternalPath ? returnUrl : '/app';
      window.location.href = targetPath;
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] transition-colors duration-300 font-sans selection:bg-[#D4A77F] selection:text-[#080B12]">
      {/* Top Navbar - Matching Register Salon Header for Site-Wide Consistency */}
      <nav className="w-full border-b border-[#E5E7EB] dark:border-[#2A2F3A] bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-sm sm:text-base text-[#D4A77F] shadow-xs group-hover:rotate-12 transition-transform">
              ✂
            </div>
            <span className="font-extrabold text-base sm:text-xl text-[#1F2937] dark:text-white tracking-tight">
              Salon<span className="text-[#D4A77F]">Pro</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
            <div className="scale-90 sm:scale-100 origin-right shrink-0">
              <ThemeToggle />
            </div>
            <Link
              href="/register-salon"
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-semibold text-[11px] sm:text-xs shadow-xs transition-all whitespace-nowrap inline-flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>Free Trial</span>
              <span className="font-bold">➔</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Login Center Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-3.5 sm:p-6 w-full my-auto pb-10 pt-4">
        <div className="w-full max-w-md">
          {/* Brand Card Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#D4A77F] text-[#080B12] shadow-xl shadow-[#D4A77F]/20 mb-3 sm:mb-4 ring-4 ring-[#D4A77F]/20">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
              SalonPro
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-1">
              Salon Operating System &amp; Manager Portal
            </p>
          </div>

          {/* Login Form Box */}
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-900/5 transition-colors">
            {/* New Salon Owner Free Trial Callout - Fully Responsive on 320px+ with zero vertical stacking */}
            <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0 mt-0.5 sm:mt-0">🎁</span>
                <div>
                  <p className="text-xs font-bold text-[#8C5E2E] dark:text-[#D4A77F] flex items-center gap-1.5 flex-wrap">
                    <span>New Salon Owner?</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#D4A77F]/20 text-[#8C5E2E] dark:text-[#D4A77F] text-[9px] font-extrabold uppercase">
                      7 Days Free
                    </span>
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-0.5 leading-snug">
                    Register in 60s with zero upfront cost
                  </p>
                </div>
              </div>
              <Link
                href="/register-salon"
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all inline-flex items-center justify-center gap-1 shrink-0"
              >
                <span>Start Free Trial</span>
                <span className="font-bold">➔</span>
              </Link>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-1">
              Owner Sign In
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mb-5">
              Sign in with your registered email and password to access your salon ERP.
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-500 text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-semibold">Sign in failed</p>
                  <p className="text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all bg-[#F8F9FA] dark:bg-[#10141F] text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotNotice(!showForgotNotice)}
                    className="text-xs text-[#8C5E2E] dark:text-[#D4A77F] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all bg-[#F8F9FA] dark:bg-[#10141F] text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                  />
                </div>

                {showForgotNotice && (
                  <div className="mt-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#1F2937] dark:text-[#FFFFFF] text-xs animate-in fade-in space-y-2.5">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[#D4A77F]">
                        <span>🔑</span>
                        <span>Password Recovery &amp; Support</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowForgotNotice(false)}
                        className="text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="leading-relaxed text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                      Salon accounts are safeguarded by Platform Security. If you forgot your password, contact our dedicated{' '}
                      <a
                        href={`https://wa.me/91${supportPhone}?text=${encodeURIComponent(
                          `Hello Platform Support, I am a registered Salon Owner (${email || 'my salon'}) and need assistance resetting my password.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] underline hover:text-[#B8905F] cursor-pointer inline-flex items-center gap-0.5"
                      >
                        Platform Support (+91 {supportPhone})
                      </a>{' '}
                      team to issue a secure password reset.
                    </p>
                    <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row gap-2">
                      <a
                        href={`https://wa.me/91${supportPhone}?text=${encodeURIComponent(
                          `Hello Platform Support, I am a registered Salon Owner (${email || 'my salon'}) and need assistance resetting my password.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>💬 WhatsApp (+91 {supportPhone})</span>
                      </a>
                      <a
                        href={`mailto:${supportEmail}?subject=SalonPro%20Owner%20Password%20Reset%20Request&body=Hello%20Platform%20Support,%0D%0A%0D%0AI%20am%20requesting%20a%20password%20reset%20for%20my%20salon%20owner%20account:%20${encodeURIComponent(
                          email || ''
                        )}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#F8F9FA] dark:bg-[#1C2230] hover:bg-neutral-100 text-[#1F2937] dark:text-white border border-[#E5E7EB] dark:border-[#2A2F3A] font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>✉️ Email Support</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-sm shadow-lg shadow-[#D4A77F]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#080B12]" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Direct Link to Register */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] block">
                  Don&apos;t have a salon account yet?
                </p>
                <Link
                  href="/register-salon"
                  className="block mt-1 font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline text-xs"
                >
                  Create Account &amp; Start 7-Day Free Trial ➔
                </Link>
              </div>

              {/* 1-Click Salon Owner ERP Demo Test-Drive */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-[#1F2937] dark:text-[#FFFFFF] flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-500 shrink-0">⚡</span>
                  <span className="truncate">Want to test-drive without credentials?</span>
                </div>
                <a
                  href="/api/demo/owner-login"
                  className="font-extrabold text-amber-600 dark:text-amber-400 hover:underline shrink-0 text-xs inline-flex items-center gap-0.5"
                >
                  <span>1-Click Owner Demo</span>
                  <span>➔</span>
                </a>
              </div>
            </form>

            {/* Footer Info & Panel Nav */}
            <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8]">
              <span>Panel 2 of 3 · Salon ERP</span>
              <Link href="/" className="hover:text-[#D4A77F] underline">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
