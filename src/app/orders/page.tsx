'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button, Input, Select } from '@/components/UIComponents';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Customer, Product } from '@/types';
import Link from 'next/link';

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  total_amount: number;
  delivery_date: string;
  notes: string;
  status: 'pending' | 'delivered';
  created_at: string;
  updated_at: string;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Lulu Fruit',
    sku: 'LULU-001',
    price: 8.50,
    unit: 'kg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Tomate del Árbol',
    sku: 'TOMATE-001',
    price: 6.75,
    unit: 'kg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Restaurant La Bella',
    email: 'contact@labella.com',
    phone: '555-0100',
    city: 'San Jose',
    address: '123 Main St',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Market Central',
    email: 'info@marketcentral.com',
    phone: '555-0101',
    city: 'San Francisco',
    address: '456 Market Ave',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      customer_id: '1',
      items: [
        { product_id: '1', quantity: 10, unit_price: 8.5, subtotal: 85 },
        { product_id: '2', quantity: 5, unit_price: 6.75, subtotal: 33.75 },
      ],
      total_amount: 118.75,
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: 'Morning delivery preferred',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Orders</h1>
            <p className="text-slate-400 mt-1">Create and manage orders</p>
          </div>
          <Link href="/orders/new">
            <Button variant="primary">
              <Plus size={20} />
              New Order
            </Button>
          </Link>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Delivery Date
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
              {orders.map((order) => {
                const customer = CUSTOMERS.find((c) => c.id === order.customer_id);
                return (
                  <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-medium">#{order.id}</td>
                    <td className="px-4 py-3 text-slate-300">{customer?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-300">{order.items.length} items</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{order.delivery_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-emerald-900 text-emerald-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-blue-600 rounded text-blue-400">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 hover:bg-red-600 rounded text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-8 text-slate-400">No orders yet</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
