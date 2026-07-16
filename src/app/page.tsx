'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, FileText, Plus, ShoppingBasket, Trash2, Truck } from 'lucide-react';
import { Customer } from '@/types';
import { addCustomer, deleteCustomer, getCustomers } from '@/lib/customer-storage';

const FEATURES = [
  {
    title: 'Fast invoices',
    description: 'Build fresh invoices for each customer in minutes.',
    icon: FileText,
  },
  {
    title: 'Delivery-ready',
    description: 'Keep track of deliveries, payments, and order notes.',
    icon: Truck,
  },
  {
    title: 'Order management',
    description: 'Move from customer selection to billing without switching tools.',
    icon: ClipboardList,
  },
];

const EMPTY_FORM = { name: '', city: '', address: '' };

export default function Home() {
  // Seeded and read from localStorage, so it has to happen after mount — the
  // page is prerendered and the store is empty on the server.
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const handleAddCustomer = (event: React.FormEvent) => {
    event.preventDefault();
    addCustomer({
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
    });
    setCustomers(getCustomers());
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteCustomer(pendingDelete.id);
    setCustomers(getCustomers());
    setPendingDelete(null);
  };

  return (
    <div className="theme-dark min-h-screen bg-slate-900 text-slate-100">
      <div className="header">
        <div className="container py-14 lg:py-20">
          <div className="max-w-4xl text-center">
            <span className="brand-badge">LA FRUTA</span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-4">
              Fresh fruit invoices for every delivery.
            </h1>
            <p className="mt-4 text-lg text-emerald-50/90 max-w-2xl mx-auto">
              Create polished invoices, manage your fruit customers, and keep your produce business moving with a simple online workspace.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="#customers" className="btn btn-light inline-flex items-center gap-2">
                <ShoppingBasket size={18} />
                Start an invoice
              </Link>
              <Link href="/dashboard" className="btn btn-secondary">
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-10 lg:py-14">
        <section className="hero-card grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Fruit business workspace</p>
            <h2 className="text-2xl font-bold text-white mt-2">Everything you need to bill customers smoothly</h2>
            <p className="text-slate-400 mt-3">
              Keep your invoices, orders, and delivery notes in one place so your team can focus on the fruit, not the paperwork.
            </p>
          </div>
          <div className="grid gap-3">
            {FEATURES.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-emerald-700 bg-emerald-900/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900 p-2 text-emerald-400">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="customers" className="card mt-8 scroll-mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Select a customer</h2>
              <p className="text-slate-400 mt-1">Open a customer profile and create or review an invoice in seconds.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Add customer
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => (
              <div key={customer.id} className="group relative">
                <Link
                  href={`/invoice/${customer.id}`}
                  className="block rounded-2xl border border-slate-700 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{customer.name}</h3>
                    <span className="rounded-full bg-emerald-900 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      Invoice
                    </span>
                  </div>
                  {customer.city && <p className="mt-2 pr-9 text-sm text-slate-400">{customer.city}</p>}
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${customer.name}`}
                  onClick={() => setPendingDelete(customer)}
                  className="absolute bottom-4 right-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-950 hover:text-red-400 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Customer</h2>

            <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-8">
            <h2 className="text-2xl font-bold text-white">Delete customer?</h2>
            <p className="mt-3 text-slate-400">
              <span className="font-semibold text-slate-200">{pendingDelete.name}</span> will be removed from your
              customer list. This can&apos;t be undone.
            </p>

            <div className="flex gap-3 pt-6">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-700 bg-slate-800 py-6 mt-10">
        <div className="container text-center text-sm text-slate-400">
          <p>LA FRUTA • Fruit invoice website • {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
