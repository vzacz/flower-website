'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, FileText, ShoppingBasket, Truck } from 'lucide-react';
import { Customer } from '@/types';

const CUSTOMERS: Customer[] = [
  { id: '1', name: 'El Chaparral', city: 'San Jose' },
  { id: '2', name: 'Mi Ranchito Sunnyvale', city: 'Sunnyvale' },
  { id: '3', name: 'Mi Ranchito Market San Jose', city: 'San Jose' },
  { id: '4', name: 'Olala Campbell', city: 'Campbell' },
  { id: '5', name: 'Ayyar South San Francisco', city: 'South San Francisco' },
  { id: '6', name: 'Mina’s Cafe Foster City', city: 'Foster City' },
  { id: '7', name: 'La Prada San Jose', city: 'San Jose' },
];

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(135deg,_#f9fff8_0%,_#fdfefe_100%)]">
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
              <Link href="/invoice/1" className="btn btn-light inline-flex items-center gap-2">
                <ShoppingBasket size={18} />
                Start an invoice
              </Link>
              <Link href="/dashboard" className="btn btn-secondary text-slate-900">
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-10 lg:py-14">
        <section className="hero-card grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Fruit business workspace</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">Everything you need to bill customers smoothly</h2>
            <p className="text-slate-600 mt-3">
              Keep your invoices, orders, and delivery notes in one place so your team can focus on the fruit, not the paperwork.
            </p>
          </div>
          <div className="grid gap-3">
            {FEATURES.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Select a customer</h2>
              <p className="text-slate-600 mt-1">Open a customer profile and create or review an invoice in seconds.</p>
            </div>
            <Link href="/customers" className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
              Manage customers <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CUSTOMERS.map((customer) => (
              <Link
                key={customer.id}
                href={`/invoice/${customer.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Invoice
                  </span>
                </div>
                {customer.city && <p className="mt-2 text-sm text-slate-600">{customer.city}</p>}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/80 py-6 mt-10">
        <div className="container text-center text-sm text-slate-600">
          <p>LA FRUTA • Fruit invoice website • {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
