import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold mb-2">Page or Receipt Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested digital receipt or page could not be found. Please verify the URL or contact salon support.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-md shadow-pink-600/20"
      >
        Return Home ➔
      </Link>
    </div>
  );
}
