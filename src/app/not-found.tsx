import Link from 'next/link';
import { Sparkles, Home, User, LogIn } from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col items-center justify-center p-4 sm:p-6 text-center transition-colors duration-250">
      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-1">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-xs text-[#D4A77F]">
            ✂
          </div>
          <span className="font-extrabold text-sm text-[#1F2937] dark:text-white">
            Studio<span className="text-[#D4A77F]">Desk</span>
          </span>
        </Link>
        <div className="scale-90 origin-right">
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#D4A77F]/15 border border-[#D4A77F]/30 text-[#D4A77F] flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-inner">
          404
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] dark:text-white mb-2">
          Page or Resource Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] max-w-sm mx-auto mb-6 leading-relaxed">
          The requested page, salon showcase, or digital receipt could not be found. Please check the URL or choose a destination below:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold transition-all shadow-md active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#252B3B] text-[#1F2937] dark:text-white border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-bold transition-all active:scale-98"
          >
            <User className="w-4 h-4 text-[#D4A77F]" />
            <span>Client Portal</span>
          </Link>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors font-medium"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Salon Owner / Staff Sign In</span>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#747D8D]">
        <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
        <span>StudioDesk · Operating with Excellence</span>
      </div>
    </div>
  );
}

