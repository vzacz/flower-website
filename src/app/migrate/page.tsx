'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Customer, Invoice } from '@/types';
import { importBrowserData, type MigrationResult } from '@/app/actions/migrate';

/**
 * One-time import of invoices that predate the database.
 *
 * Those invoices only exist in the browser that created them, so this page has
 * to run there. It never clears localStorage: the old copy stays put as a
 * fallback until the import is confirmed good.
 */

const CUSTOMERS_KEY = 'la_fruta_customers';
const INVOICES_KEY = 'la_fruta_invoices';

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export default function MigratePage() {
  const [found, setFound] = useState<{ customers: Customer[]; invoices: Invoice[] } | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, startRunning] = useTransition();

  useEffect(() => {
    setFound({
      customers: readStore<Customer>(CUSTOMERS_KEY),
      invoices: readStore<Invoice>(INVOICES_KEY),
    });
  }, []);

  const handleImport = () => {
    if (!found) return;
    setError(null);

    startRunning(async () => {
      try {
        setResult(await importBrowserData(found));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'The import failed.');
      }
    });
  };

  const total = (found?.invoices.length ?? 0) + (found?.customers.length ?? 0);

  return (
    <div className="theme-dark min-h-screen bg-slate-900 text-slate-100">
      <main className="container max-w-2xl py-14">
        <h1 className="text-3xl font-bold text-white">Import invoices from this browser</h1>
        <p className="mt-3 text-slate-400">
          LA FRUTA used to save invoices inside your browser. They now live in a database that every
          device shares. This copies anything still stored in <em>this</em> browser across.
        </p>

        {!found && <p className="mt-8 text-slate-400">Checking this browser...</p>}

        {found && total === 0 && (
          <div className="card mt-8">
            <p className="text-slate-300">Nothing to import — this browser has no saved invoices.</p>
            <p className="mt-2 text-sm text-slate-500">
              If you created invoices on a different computer or browser, open this page there.
            </p>
            <Link href="/dashboard" className="btn btn-primary mt-6 inline-flex">
              Go to dashboard
            </Link>
          </div>
        )}

        {found && total > 0 && !result && (
          <div className="card mt-8">
            <p className="text-slate-300">Found in this browser:</p>
            <ul className="mt-3 space-y-1 text-slate-400">
              <li>
                <span className="font-semibold text-white">{found.invoices.length}</span> invoice
                {found.invoices.length !== 1 ? 's' : ''}
              </li>
              <li>
                <span className="font-semibold text-white">{found.customers.length}</span> customer
                {found.customers.length !== 1 ? 's' : ''}
              </li>
            </ul>

            <p className="mt-4 text-sm text-slate-500">
              Anything already in the database is left untouched, so running this twice is harmless.
              Your browser copy is not deleted.
            </p>

            <button className="btn btn-primary mt-6" onClick={handleImport} disabled={running}>
              {running ? 'Importing...' : 'Import into the database'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="card mt-8">
            <h2 className="text-xl font-bold text-white">Import finished</h2>
            <ul className="mt-4 space-y-1 text-slate-300">
              <li>Invoices added: {result.invoicesAdded}</li>
              <li>Invoices already there: {result.invoicesSkipped}</li>
              <li>Customers added: {result.customersAdded}</li>
              <li>Customers already there: {result.customersSkipped}</li>
            </ul>

            {result.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-4">
                <p className="text-sm font-semibold text-red-300">
                  {result.errors.length} item{result.errors.length !== 1 ? 's' : ''} could not be
                  imported:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-300/90">
                  {result.errors.map((message) => (
                    <li key={message}>• {message}</li>
                  ))}
                </ul>
              </div>
            )}

            <Link href="/invoices" className="btn btn-primary mt-6 inline-flex">
              Check your invoices
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
