'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, History, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Generator', icon: BookOpen },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 hide-on-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 fill-white/20" />
                </div>
                <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
                  GenZ Soal
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors",
                    pathname === href
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <Icon className={cn("w-4 h-4 mr-2", pathname === href ? "text-indigo-500" : "text-slate-400")} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
