import type { Metadata } from 'next';
import { Inter, DM_Sans, Playfair_Display, Noto_Sans_Gujarati } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ToastContainer from '@/components/ui/ToastContainer';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
});

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
});

const notoGujarati = Noto_Sans_Gujarati({
  variable: '--font-gujarati',
  subsets: ['gujarati', 'latin'],
  display: 'swap',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'StudioDesk - Modern Luxury Salon & Spa Management Platform',
  description: 'Next-generation salon & studio operating system, live floor Kanban, client booking, and 10-second POS billing.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${inter.variable} ${playfair.variable} ${notoGujarati.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('studiodesk_theme')||localStorage.getItem('studiodesk_theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full font-sans antialiased bg-white text-[#1F2937] dark:bg-[#080B12] dark:text-[#FFFFFF] transition-colors duration-200">
        {children}
        <ToastContainer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
