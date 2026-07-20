'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { AlertCircle, CheckCircle2, ChevronDown, Send, Trash2 } from 'lucide-react';
import { SentEmail } from '@/types';
import { deleteSentEmail, listSentEmails } from '@/app/actions/emails';
import { sendInvoiceEmail } from '@/lib/email-service';

function formatSentAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, startBusy] = useTransition();

  const refresh = async () => setEmails(await listSentEmails());

  useEffect(() => {
    listSentEmails()
      .then(setEmails)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load the email history.')
      )
      .finally(() => setLoaded(true));
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return emails.filter(
      (email) =>
        !term ||
        email.place.toLowerCase().includes(term) ||
        email.customerName.toLowerCase().includes(term) ||
        email.invoiceNumber.toLowerCase().includes(term) ||
        email.recipient.toLowerCase().includes(term)
    );
  }, [emails, search]);

  const sentCount = emails.filter((email) => email.status === 'sent').length;
  const failedCount = emails.filter((email) => email.status === 'failed').length;

  const handleResend = async (email: SentEmail) => {
    setNotice(null);
    setResendingId(email.id);
    try {
      await sendInvoiceEmail(email.recipient, email.invoice, email.message);
      setNotice({
        ok: true,
        text: `Invoice ${email.invoiceNumber} sent again to ${email.recipient}.`,
      });
      await refresh();
    } catch (err: unknown) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : 'Could not send that email again.',
      });
      // The send failed, but the server still logged the attempt — reload so the
      // failure shows up in the list rather than only in this message.
      await refresh().catch(() => {});
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = (email: SentEmail) => {
    if (!window.confirm(`Remove the record of the email to ${email.recipient}?`)) return;
    setNotice(null);
    startBusy(async () => {
      try {
        await deleteSentEmail(email.id);
        await refresh();
      } catch (err: unknown) {
        setNotice({
          ok: false,
          text: err instanceof Error ? err.message : 'Could not remove that record.',
        });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Email</h1>
            <p className="text-slate-400 mt-1">
              Every invoice you&apos;ve emailed, and what was on it
            </p>
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

        {notice && (
          <p
            role="status"
            className={`rounded-lg border p-4 text-sm ${
              notice.ok
                ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                : 'border-red-800 bg-red-950/40 text-red-300'
            }`}
          >
            {notice.text}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Emails</p>
            <p className="text-3xl font-bold text-white mt-2">{emails.length}</p>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-700">
            <p className="text-emerald-400 text-sm">Delivered</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{sentCount}</p>
          </div>
          <div className="bg-red-900/20 rounded-lg p-6 border border-red-700">
            <p className="text-red-400 text-sm">Failed</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{failedCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <input
            type="text"
            className="input mb-6 max-w-sm"
            placeholder="Search by place, invoice #, or address"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {!loaded ? (
            <p className="py-8 text-center text-slate-400">Loading...</p>
          ) : shown.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-400">
                {emails.length === 0
                  ? 'No emails sent yet. Email an invoice and it will show up here.'
                  : 'No emails match that search.'}
              </p>
              {emails.length === 0 && (
                <Link href="/" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
                  Pick a customer to send your first invoice →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((email) => {
                const isOpen = openId === email.id;
                const failed = email.status === 'failed';

                return (
                  <div
                    key={email.id}
                    className={`rounded-lg border transition-colors ${
                      failed
                        ? 'border-red-800/70 bg-red-950/20'
                        : 'border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : email.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-800/40 rounded-lg transition-colors"
                    >
                      {failed ? (
                        <AlertCircle size={20} className="shrink-0 text-red-400" />
                      ) : (
                        <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-white">{email.place}</p>
                        <p className="truncate text-sm text-slate-400">
                          {email.invoiceNumber} · {email.recipient}
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        <p
                          className={`font-bold ${failed ? 'text-red-400' : 'text-emerald-400'}`}
                        >
                          ${email.totalDue.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-400">{formatSentAt(email.sentAt)}</p>
                      </div>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-700/70 p-4 space-y-4">
                        <div className="sm:hidden">
                          <p className="text-sm text-slate-400">
                            {formatSentAt(email.sentAt)} · ${email.totalDue.toFixed(2)}
                          </p>
                        </div>

                        {failed && email.error && (
                          <p className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                            This one did not go out: {email.error}
                          </p>
                        )}

                        {/* Only worth showing when it says something the title
                            doesn't — usually the person the invoice names. */}
                        {email.customerName !== email.place && (
                          <p className="text-sm text-slate-300">
                            <span className="text-slate-400">Made out to: </span>
                            {email.customerName}
                          </p>
                        )}

                        {email.message && (
                          <p className="text-sm text-slate-300">
                            <span className="text-slate-400">Your note: </span>
                            {email.message}
                          </p>
                        )}

                        {email.invoice.items.length === 0 ? (
                          <p className="text-sm text-slate-400">No items on this invoice.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-700">
                                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-300">
                                    Fruit
                                  </th>
                                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-300">
                                    Description
                                  </th>
                                  <th className="px-3 py-2 text-right text-sm font-medium text-slate-300">
                                    Boxes
                                  </th>
                                  <th className="px-3 py-2 text-right text-sm font-medium text-slate-300">
                                    Price/box
                                  </th>
                                  <th className="px-3 py-2 text-right text-sm font-medium text-slate-300">
                                    Amount
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {email.invoice.items.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-800">
                                    <td className="px-3 py-2 text-white">{item.fruit}</td>
                                    <td className="px-3 py-2 text-slate-400">
                                      {item.description ?? ''}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                      ${item.pricePerBox.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                      ${item.amount.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-slate-400">
                            Subtotal ${email.invoice.subtotal.toFixed(2)} · Discount −$
                            {email.invoice.discount.toFixed(2)} ·{' '}
                            <span className="font-bold text-white">
                              Total ${email.totalDue.toFixed(2)}
                            </span>
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResend(email)}
                              disabled={resendingId === email.id}
                              className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-60"
                            >
                              <Send size={16} />
                              {resendingId === email.id ? 'Sending...' : 'Send again'}
                            </button>

                            {email.customerId && (
                              <Link
                                href={`/invoice/${email.customerId}${
                                  email.invoiceId ? `?invoice=${email.invoiceId}` : ''
                                }`}
                                className="btn btn-secondary"
                              >
                                Open invoice
                              </Link>
                            )}

                            <button
                              onClick={() => handleDelete(email)}
                              disabled={busy}
                              title="Remove this record"
                              className="p-2 rounded text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-60"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
