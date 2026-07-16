import Link from 'next/link';
import { Home, SearchX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function NotFound() {
  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900/30 text-emerald-400">
            <SearchX size={30} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Error 404</p>
          <h1 className="mt-2 text-3xl font-bold text-white">This page doesn&apos;t exist</h1>
          <p className="mt-3 text-slate-400">
            The page you&apos;re looking for may have been moved or removed. Use the menu to keep working, or head back
            to the workspace home.
          </p>

          <Link href="/" className="btn btn-primary mt-8 inline-flex items-center gap-2">
            <Home size={18} />
            Back to home
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
