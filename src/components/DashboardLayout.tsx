'use client';

import Navigation from './Navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-dark min-h-screen bg-slate-900 text-slate-100">
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
