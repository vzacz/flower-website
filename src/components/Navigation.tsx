'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home, Package, ShoppingCart, FileText, LogOut, Truck } from 'lucide-react';
import { logout } from '@/app/actions/auth';

const Navigation = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/customers', label: 'Customers', icon: Package },
    { href: '/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/delivery-routes', label: 'Delivery Routes', icon: Truck },
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
