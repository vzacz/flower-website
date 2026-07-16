'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/UIComponents';

interface ReportData {
  date: string;
  orders: number;
  revenue: number;
  deliveries: number;
  customers: number;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  const weeklyData: ReportData[] = [
    { date: 'Week 1', orders: 24, revenue: 2450.50, deliveries: 18, customers: 12 },
    { date: 'Week 2', orders: 31, revenue: 3125.75, deliveries: 25, customers: 15 },
    { date: 'Week 3', orders: 28, revenue: 2875.25, deliveries: 22, customers: 14 },
    { date: 'Week 4', orders: 35, revenue: 3540.00, deliveries: 28, customers: 18 },
  ];

  const monthlyData: ReportData[] = [
    { date: 'January', orders: 118, revenue: 11991.50, deliveries: 93, customers: 35 },
    { date: 'February', orders: 105, revenue: 10750.75, deliveries: 84, customers: 32 },
    { date: 'March', orders: 142, revenue: 14280.25, deliveries: 112, customers: 42 },
  ];

  const data = reportType === 'weekly' ? weeklyData : monthlyData;

  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalDeliveries = data.reduce((sum, d) => sum + d.deliveries, 0);
  const totalCustomers = data.reduce((sum, d) => sum + d.customers, 0);

  const handleDownloadReport = () => {
    alert(`Downloading ${reportType} report...`);
    // Report download will be implemented
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-slate-400 mt-1">Analyze your business performance</p>
          </div>
          <Button
            variant="primary"
            onClick={handleDownloadReport}
          >
            <Download size={20} />
            Download Report
          </Button>
        </div>

        {/* Report Type Selection */}
        <div className="flex gap-4">
          <button
            onClick={() => setReportType('weekly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              reportType === 'weekly'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              reportType === 'monthly'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Monthly Report
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-white mt-2">{totalOrders}</p>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-700">
            <p className="text-emerald-400 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-700">
            <p className="text-blue-400 text-sm">Total Deliveries</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{totalDeliveries}</p>
          </div>
          <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-700">
            <p className="text-purple-400 text-sm">Active Customers</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{totalCustomers}</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-4">
            {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Breakdown
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Deliveries
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Customers
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Avg Order
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const avgOrder = row.revenue / row.orders;
                return (
                  <tr key={row.date} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">{row.date}</td>
                    <td className="px-4 py-3 text-slate-300">{row.orders}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">${row.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{row.deliveries}</td>
                    <td className="px-4 py-3 text-slate-300">{row.customers}</td>
                    <td className="px-4 py-3 text-blue-400">${avgOrder.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-700">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="text-emerald-500" size={24} />
              <h3 className="text-lg font-bold text-white">Key Insights</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>📈 Revenue increased by 18% compared to last period</li>
              <li>✅ Delivery success rate: 98.5%</li>
              <li>⭐ Average customer satisfaction: 4.8/5</li>
              <li>💡 Best performing day: Wednesday</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-700">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="text-blue-500" size={24} />
              <h3 className="text-lg font-bold text-white">Recommendations</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>📦 Consider increasing Tomate stock by 15%</li>
              <li>👥 Top customer: Restaurant La Bella ($1,250 revenue)</li>
              <li>🚚 Optimize delivery route on Fridays</li>
              <li>💰 Negotiate better rates with suppliers</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
