'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/UIComponents';
import { Download, Eye, Mail, RotateCw } from 'lucide-react';

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'partially_paid';
  created_at: string;
  updated_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: '1',
      invoice_number: 'INV-2024-001',
      order_id: 'order-1',
      customer_id: '1',
      total_amount: 275.5,
      paid_amount: 0,
      due_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
      status: 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      invoice_number: 'INV-2024-002',
      order_id: 'order-2',
      customer_id: '2',
      total_amount: 450.00,
      paid_amount: 450.00,
      due_date: new Date(Date.now() - 604800000).toISOString().split('T')[0],
      status: 'paid',
      created_at: new Date(Date.now() - 1209600000).toISOString(),
      updated_at: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: '3',
      invoice_number: 'INV-2024-003',
      order_id: 'order-3',
      customer_id: '1',
      total_amount: 180.75,
      paid_amount: 100.00,
      due_date: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
      status: 'partially_paid',
      created_at: new Date(Date.now() - 432000000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const handleDownloadPDF = (invoice: InvoiceRecord) => {
    alert(`Downloading PDF for invoice ${invoice.invoice_number}`);
    // PDF generation will be implemented
  };

  const handleSendEmail = (invoice: InvoiceRecord) => {
    alert(`Sending email for invoice ${invoice.invoice_number}`);
    // Email sending will be implemented
  };

  const handleMarkAsPaid = (id: string) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: 'paid',
              paid_amount: inv.total_amount,
              updated_at: new Date().toISOString(),
            }
          : inv
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-900 text-emerald-200';
      case 'unpaid':
        return 'bg-red-900 text-red-200';
      case 'partially_paid':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-slate-900 text-slate-200';
    }
  };

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.paid_amount, 0);

  const outstandingAmount = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 mt-1">Manage and track customer invoices</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Invoices</p>
            <p className="text-3xl font-bold text-white mt-2">{invoices.length}</p>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-700">
            <p className="text-emerald-400 text-sm">Paid Revenue</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-red-900/20 rounded-lg p-6 border border-red-700">
            <p className="text-red-400 text-sm">Outstanding</p>
            <p className="text-3xl font-bold text-red-400 mt-2">${outstandingAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Paid
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-white">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-300">Customer #{invoice.customer_id}</td>
                  <td className="px-4 py-3 text-slate-300">${invoice.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-400">
                    ${invoice.paid_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{invoice.due_date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        title="Download PDF"
                        className="p-2 hover:bg-blue-600/30 rounded text-blue-400 transition-colors"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleSendEmail(invoice)}
                        title="Send Email"
                        className="p-2 hover:bg-purple-600/30 rounded text-purple-400 transition-colors"
                      >
                        <Mail size={16} />
                      </button>
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          title="Mark as Paid"
                          className="p-2 hover:bg-emerald-600/30 rounded text-emerald-400 transition-colors"
                        >
                          <RotateCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
