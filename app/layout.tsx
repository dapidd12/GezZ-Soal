import type {Metadata} from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'GenZ Soal - AI Question Generator',
  description: 'Generate soal pilihan ganda, essay, dan hybrid dengan mudah menggunakan AI.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900 selection:bg-indigo-100 selection:text-indigo-900" suppressHydrationWarning>
        <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 hide-on-print"></div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
