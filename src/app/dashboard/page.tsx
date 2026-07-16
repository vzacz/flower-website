'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { StatCard } from '@/components/UIComponents';
import { DollarSign, FileText, Plus, TrendingUp, Users } from 'lucide-react';
import { Customer, Invoice } from '@/types';
import { getInvoices } from '@/lib/invoice-storage';
import { getCustomers } from '@/lib/customer-storage';

export default function Dashboard() {
  // Both stores live in localStorage, so they can only be read after mount.
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInvoices(getInvoices());
    setCustomers(getCustomers());
    setLoading(false);
  }, []);

  const paid = invoices.filter((invoice) => invoice.status === 'paid');
  const unpaid = invoices.filter((invoice) => invoice.status !== 'paid');

  const paidRevenue = paid.reduce((sum, invoice) => sum + invoice.totalDue, 0);
  const outstandingAmount = unpaid.reduce((sum, invoice) => sum + invoice.totalDue, 0);
  const billed = invoices.reduce((sum, invoice) => sum + invoice.totalDue, 0);
  const averageInvoice = invoices.length ? billed / invoices.length : 0;

  const recentInvoices = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Your invoicing at a glance.</p>
          </div>
          <Link href="/" className="btn btn-primary">
            <Plus size={20} />
            New invoice
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Paid Revenue"
            value={`$${paidRevenue.toFixed(2)}`}
            icon={<DollarSign size={24} />}
            subtitle={`${paid.length} paid invoice${paid.length !== 1 ? 's' : ''}`}
          />
          <StatCard
            title="Outstanding"
            value={`$${outstandingAmount.toFixed(2)}`}
            icon={<FileText size={24} />}
            subtitle={`${unpaid.length} unpaid invoice${unpaid.length !== 1 ? 's' : ''}`}
          />
          <StatCard
            title="Total Invoices"
            value={invoices.length}
            icon={<TrendingUp size={24} />}
            subtitle={`$${billed.toFixed(2)} billed`}
          />
          <StatCard
            title="Customers"
            value={customers.length}
            icon={<Users size={24} />}
            subtitle="In your customer list"
          />
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
            <Link href="/invoices" className="text-emerald-500 hover:text-emerald-400 text-sm">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No invoices yet.</p>
              <Link href="/" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
                Pick a customer to create your first invoice →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoice/${invoice.customerId}?invoice=${invoice.id}`}
                  className="flex justify-between items-center p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{invoice.customerName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {invoice.invoiceNumber} • {invoice.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-emerald-500">
                      ${invoice.totalDue.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
            <h3 className="font-bold text-white mb-2">Average Invoice Value</h3>
            <p className="text-2xl font-bold text-emerald-400">${averageInvoice.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Across {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h3 className="font-bold text-white mb-2">Collected</h3>
            <p className="text-2xl font-bold text-blue-400">
              {billed > 0 ? `${Math.round((paidRevenue / billed) * 100)}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Of everything billed so far</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
