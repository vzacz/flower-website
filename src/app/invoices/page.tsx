'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { Invoice } from '@/types';
import { deleteInvoice, listInvoices, saveInvoice } from '@/app/actions/invoices';
import { markInvoiceAsPaid, markInvoiceAsUnpaid } from '@/lib/invoice-model';
import { downloadInvoicePDF, generateInvoicePDF } from '@/lib/pdf-generator';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, startBusy] = useTransition();

  const refresh = async () => setInvoices(await listInvoices());

  useEffect(() => {
    listInvoices()
      .then(setInvoices)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load invoices.')
      )
      .finally(() => setLoaded(true));
  }, []);

  const sorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices
      .filter(
        (invoice) =>
          !term ||
          invoice.customerName.toLowerCase().includes(term) ||
          invoice.invoiceNumber.toLowerCase().includes(term)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [invoices, search]);

  const paidRevenue = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.totalDue, 0);

  const outstanding = invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.totalDue, 0);

  const handleTogglePaid = (invoice: Invoice) => {
    setError(null);
    startBusy(async () => {
      try {
        await saveInvoice(
          invoice.status === 'paid' ? markInvoiceAsUnpaid(invoice) : markInvoiceAsPaid(invoice)
        );
        await refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not update the invoice.');
      }
    });
  };

  const handleDelete = (invoice: Invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    setError(null);
    startBusy(async () => {
      try {
        await deleteInvoice(invoice.id);
        await refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not delete the invoice.');
      }
    });
  };

  const handleDownload = (invoice: Invoice) => {
    downloadInvoicePDF(generateInvoicePDF(invoice), invoice.invoiceNumber);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Invoices</h1>
            <p className="text-slate-400 mt-1">Every invoice you&apos;ve saved, across all customers</p>
          </div>
          <Link href="/" className="btn btn-primary">
            New invoice
          </Link>
        </div>

        {error && (
          <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Invoices</p>
            <p className="text-3xl font-bold text-white mt-2">{invoices.length}</p>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-700">
            <p className="text-emerald-400 text-sm">Paid Revenue</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">${paidRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-red-900/20 rounded-lg p-6 border border-red-700">
            <p className="text-red-400 text-sm">Outstanding</p>
            <p className="text-3xl font-bold text-red-400 mt-2">${outstanding.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <input
            type="text"
            className="input mb-6 max-w-sm"
            placeholder="Search by customer or invoice #"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {!loaded ? (
            <p className="py-8 text-center text-slate-400">Loading...</p>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-400">
                {invoices.length === 0 ? 'No invoices saved yet.' : 'No invoices match that search.'}
              </p>
              {invoices.length === 0 && (
                <Link href="/" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
                  Pick a customer to create your first invoice →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Invoice #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-white">
                        <Link
                          href={`/invoice/${invoice.customerId}?invoice=${invoice.id}`}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{invoice.customerName}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">${invoice.totalDue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">{invoice.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-emerald-900 text-emerald-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/invoice/${invoice.customerId}?invoice=${invoice.id}`}
                            title="Open invoice"
                            className="p-2 hover:bg-blue-600/30 rounded text-blue-400 transition-colors"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => handleDownload(invoice)}
                            title="Download PDF"
                            className="p-2 hover:bg-purple-600/30 rounded text-purple-400 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleTogglePaid(invoice)}
                            title={invoice.status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                            className="p-2 hover:bg-emerald-600/30 rounded text-emerald-400 transition-colors"
                          >
                            <RotateCw size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
                            title="Delete invoice"
                            className="p-2 hover:bg-red-600/30 rounded text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
