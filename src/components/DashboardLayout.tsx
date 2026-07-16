'use client';

import Navigation from './Navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <div className="flex min-h-screen">
        <Navigation />
        <main className="flex-1 md:ml-64">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
