'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { StatCard, Button } from '@/components/UIComponents';
import {
  Truck,
  DollarSign,
  FileText,
  ShoppingCart,
  TrendingUp,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  todayDeliveries: number;
  weeklyRevenue: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  recentOrders: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    todayDeliveries: 8,
    weeklyRevenue: 4235.50,
    outstandingInvoices: 12,
    outstandingAmount: 3450.75,
    recentOrders: [
      {
        id: '1',
        customer: 'Restaurant La Bella',
        amount: 280.50,
        date: new Date().toISOString(),
        status: 'pending',
      },
      {
        id: '2',
        customer: 'Market Central',
        amount: 450.00,
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'delivered',
      },
      {
        id: '3',
        customer: 'Fresh Foods Café',
        amount: 180.25,
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'delivered',
      },
    ],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from Supabase
    // For now, simulating data load
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Welcome back! Here's your business overview.
            </p>
          </div>
          <Link href="/orders/new">
            <Button variant="primary">
              <Plus size={20} />
              New Order
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Deliveries"
            value={data.todayDeliveries}
            icon={<Truck size={24} />}
            subtitle="Active deliveries"
            trend={12}
          />
          <StatCard
            title="Weekly Revenue"
            value={`$${data.weeklyRevenue.toFixed(2)}`}
            icon={<DollarSign size={24} />}
            subtitle="Last 7 days"
            trend={8}
          />
          <StatCard
            title="Outstanding Invoices"
            value={data.outstandingInvoices}
            icon={<FileText size={24} />}
            subtitle={`$${data.outstandingAmount.toFixed(2)} due`}
            trend={-3}
          />
          <StatCard
            title="Total Orders"
            value="156"
            icon={<ShoppingCart size={24} />}
            subtitle="This month"
            trend={5}
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <Link href="/orders">
              <span className="text-emerald-500 hover:text-emerald-400 text-sm cursor-pointer">
                View all →
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : data.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No orders yet</div>
          ) : (
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{order.customer}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-emerald-500">
                      ${order.amount.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-yellow-900 text-yellow-200'
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-emerald-500" />
              <h3 className="font-bold text-white">Performance</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-400">↑ 18%</p>
            <p className="text-xs text-slate-400 mt-1">vs last month</p>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h3 className="font-bold text-white mb-2">Average Order Value</h3>
            <p className="text-2xl font-bold text-blue-400">$287.50</p>
            <p className="text-xs text-slate-400 mt-1">Calculated from recent orders</p>
          </div>

          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
            <h3 className="font-bold text-white mb-2">Customer Satisfaction</h3>
            <p className="text-2xl font-bold text-purple-400">4.8/5</p>
            <p className="text-xs text-slate-400 mt-1">From 24 reviews</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
