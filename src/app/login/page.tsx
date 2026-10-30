'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('security') === 'nav_reauth') {
        setSecurityNotice('🔒 Security Verification: Session locked due to browser navigation. Please sign in again.');
      }
    }
  }, []);

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
      const returnUrl = searchParams?.get('returnUrl');
      const targetPath = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/app';
      window.location.href = targetPath;
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
          {/* New Salon Owner Free Trial Callout */}
          <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">🎁</span>
              <div className="text-left">
                <p className="text-xs font-bold text-[#b3135b]">New Salon Owner?</p>
                <p className="text-[11px] text-neutral-600">Register in 60s & get 7-Day Free Trial</p>
              </div>
            </div>
            <Link
              href="/register-salon"
              className="px-3 py-1.5 rounded-lg bg-[#b3135b] hover:bg-[#960f4c] text-white text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all"
            >
              Start Free Trial ➔
            </Link>
          </div>

          <h2 className="text-xl font-bold text-[#2a1630] mb-2">
            Owner Sign In
          </h2>
          <p className="text-xs text-neutral-500 mb-5">
            Sign in with your registered email and password to access your salon ERP.
          </p>

          {securityNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs animate-in fade-in">
              <span className="text-base shrink-0">🛡️</span>
              <div>
                <p className="font-bold text-amber-900">Security Verification Required</p>
                <p className="mt-0.5">{securityNotice}</p>
              </div>
            </div>
          )}

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
                <div className="mt-2.5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs animate-in fade-in space-y-2.5">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <span>🔑</span>
                      <span>Password Recovery & Support</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowForgotNotice(false)}
                      className="text-amber-700 hover:text-amber-900 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-800">
                    Salon accounts are safeguarded by Platform Security. If you forgot your password, contact our dedicated{' '}
                    <a
                      href={`https://wa.me/918320653782?text=${encodeURIComponent(
                        `Hello Platform Support, I am a registered Salon Owner (${email || 'my salon'}) and need assistance resetting my password.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#b3135b] underline hover:text-[#960f4c] cursor-pointer inline-flex items-center gap-0.5"
                    >
                      Platform Support (+91 8320653782)
                    </a>{' '}
                    team to issue a secure password reset.
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row gap-2">
                    <a
                      href={`https://wa.me/918320653782?text=${encodeURIComponent(
                        `Hello Platform Support, I am a registered Salon Owner (${email || 'my salon'}) and need assistance resetting my password.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>💬 WhatsApp (+91 8320653782)</span>
                    </a>
                    <a
                      href={`mailto:avsarsuvagiya968@gmail.com?subject=SalonPro%20Owner%20Password%20Reset%20Request&body=Hello%20Platform%20Support,%0D%0A%0D%0AI%20am%20requesting%20a%20password%20reset%20for%20my%20salon%20owner%20account:%20${encodeURIComponent(
                        email || ''
                      )}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
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

            {/* Direct Link to Register */}
            <div className="text-center pt-2">
              <p className="text-xs text-neutral-600 block">
                Don&apos;t have a salon account yet?
              </p>
              <Link
                href="/register-salon"
                className="block mt-1 font-bold text-[#b3135b] hover:underline text-xs"
              >
                Create Account & Start 7-Day Free Trial ➔
              </Link>
            </div>
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
