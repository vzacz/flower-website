'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home, FileText, LogOut, Mail, UserRound, Wallet } from 'lucide-react';
import { logout } from '@/app/actions/auth';

const Navigation = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    // The list, not a blank invoice: from in here it's "who have I billed on
    // their own?". The button on the home page is the one that starts a new
    // solo invoice outright.
    { href: '/solo/list', label: 'Solo customers', icon: UserRound },
    { href: '/costs', label: 'Costs', icon: Wallet },
    { href: '/emails', label: 'Email', icon: Mail },
  ];

  return (
    <nav className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-800 bg-slate-950/95 backdrop-blur md:block">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-black text-emerald-400">LA FRUTA</h1>
        <p className="mt-1 text-sm text-slate-400">Fruit invoice workspace</p>
      </div>

      <div className="space-y-2 p-4">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-slate-800 p-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-emerald-400"
          >
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </nav>
  );
};

export default Navigation;
