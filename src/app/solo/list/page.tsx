'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { Customer, Invoice } from '@/types';
import { deleteCustomer, listCustomers } from '@/app/actions/customers';
import { deleteInvoice, listInvoices, saveInvoice } from '@/app/actions/invoices';
import { markInvoiceAsPaid, markInvoiceAsUnpaid } from '@/lib/invoice-model';
import { downloadInvoicePDF, generateInvoicePDF } from '@/lib/pdf-generator';

/**
 * Every invoice made out to someone billed on their own — the Invoices page,
 * narrowed to solo customers.
 *
 * A solo customer with no invoice still gets a row, so somebody whose only
 * invoice was deleted doesn't quietly vanish with no way to bill or remove
 * them. Those rows carry the customer's actions rather than an invoice's.
 */

type Row = {
  key: string;
  customer: Customer;
  invoice: Invoice | null;
};

export default function SoloCustomerListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, startBusy] = useTransition();

  const load = async (): Promise<Row[]> => {
    const [customers, invoices] = await Promise.all([listCustomers('solo'), listInvoices()]);

    const built: Row[] = customers.flatMap((customer): Row[] => {
      const theirs = invoices.filter((invoice) => invoice.customerId === customer.id);

      if (theirs.length === 0) {
        return [{ key: `customer-${customer.id}`, customer, invoice: null }];
      }

      return theirs.map((invoice) => ({ key: invoice.id, customer, invoice }));
    });

    // Newest first, like the Invoices page. Anyone with nothing billed yet sits
    // at the top, since they're the ones still waiting on an invoice.
    return built.sort((a, b) => {
      if (!a.invoice) return -1;
      if (!b.invoice) return 1;
      return b.invoice.createdAt.localeCompare(a.invoice.createdAt);
    });
  };

  const refresh = async () => setRows(await load());

  useEffect(() => {
    load()
      .then(setRows)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load solo customers.')
      )
      .finally(() => setLoaded(true));
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter(
      (row) =>
        row.customer.name.toLowerCase().includes(term) ||
        (row.customer.city ?? '').toLowerCase().includes(term) ||
        (row.invoice?.invoiceNumber.toLowerCase().includes(term) ?? false)
    );
  }, [rows, search]);

  const people = new Set(rows.map((row) => row.customer.id)).size;
  const billed = rows.reduce((sum, row) => sum + (row.invoice?.totalDue ?? 0), 0);
  const outstanding = rows.reduce(
    (sum, row) => sum + (row.invoice && row.invoice.status !== 'paid' ? row.invoice.totalDue : 0),
    0
  );

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

  const handleDeleteInvoice = (invoice: Invoice) => {
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

  const handleDeleteCustomer = (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) return;
    setError(null);
    startBusy(async () => {
      const result = await deleteCustomer(customer.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await refresh();
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Solo customers</h1>
            <p className="mt-1 text-slate-400">
              Every invoice made out to someone billed on their own
            </p>
          </div>
          <Link href="/invoice/new" className="btn btn-primary">
            <Plus size={18} />
            New solo invoice
          </Link>
        </div>

        {error && (
          <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Solo customers</p>
            <p className="mt-2 text-3xl font-bold text-white">{people}</p>
          </div>
          <div className="rounded-lg border border-emerald-700 bg-emerald-900/20 p-6">
            <p className="text-sm text-emerald-400">Billed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">${billed.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6">
            <p className="text-sm text-red-400">Outstanding</p>
            <p className="mt-2 text-3xl font-bold text-red-400">${outstanding.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <input
            type="text"
            className="input mb-6 max-w-sm"
            placeholder="Search by name, location, or invoice #"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {!loaded ? (
            <p className="py-8 text-center text-slate-400">Loading...</p>
          ) : shown.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-400">
                {rows.length === 0 ? 'No solo customers yet.' : 'Nothing matches that search.'}
              </p>
              {rows.length === 0 && (
                <Link
                  href="/invoice/new"
                  className="mt-4 inline-block text-emerald-400 hover:text-emerald-300"
                >
                  Start a solo invoice and whoever you name lands here →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ key, customer, invoice }) => (
                    <tr key={key} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={
                            invoice
                              ? `/invoice/${customer.id}?invoice=${invoice.id}`
                              : `/invoice/${customer.id}`
                          }
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{customer.city || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {invoice
                          ? `${invoice.items.length} item${invoice.items.length !== 1 ? 's' : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {invoice ? `$${invoice.totalDue.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{invoice?.date ?? '—'}</td>
                      <td className="px-4 py-3">
                        {invoice ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              invoice.status === 'paid'
                                ? 'bg-emerald-900 text-emerald-200'
                                : 'bg-red-900 text-red-200'
                            }`}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-slate-500">No invoice yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={
                              invoice
                                ? `/invoice/${customer.id}?invoice=${invoice.id}`
                                : `/invoice/${customer.id}`
                            }
                            title={invoice ? 'Open invoice' : 'Start their invoice'}
                            className="rounded p-2 text-blue-400 transition-colors hover:bg-blue-600/30"
                          >
                            <Pencil size={16} />
                          </Link>

                          {invoice ? (
                            <>
                              <button
                                onClick={() =>
                                  downloadInvoicePDF(
                                    generateInvoicePDF(invoice),
                                    invoice.invoiceNumber
                                  )
                                }
                                title="Download PDF"
                                className="rounded p-2 text-purple-400 transition-colors hover:bg-purple-600/30"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => handleTogglePaid(invoice)}
                                disabled={busy}
                                title={invoice.status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                                className="rounded p-2 text-emerald-400 transition-colors hover:bg-emerald-600/30 disabled:opacity-60"
                              >
                                <RotateCw size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(invoice)}
                                disabled={busy}
                                title="Delete invoice"
                                className="rounded p-2 text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-60"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteCustomer(customer)}
                              disabled={busy}
                              title="Delete customer"
                              className="rounded p-2 text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-60"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
