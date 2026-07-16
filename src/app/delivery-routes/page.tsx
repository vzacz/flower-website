'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/UIComponents';
import { Navigation, MapPin, Clock } from 'lucide-react';

interface RouteOrder {
  id: string;
  customer: string;
  address: string;
  items: number;
}

interface Route {
  id: string;
  date: string;
  orders: RouteOrder[];
  status: 'pending' | 'in_progress' | 'completed';
  distance: number;
  estimated_time: number;
}

export default function DeliveryRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      orders: [
        {
          id: '1',
          customer: 'Restaurant La Bella',
          address: '123 Main St, City',
          items: 3,
        },
        {
          id: '2',
          customer: 'Market Central',
          address: '456 Market Ave, City',
          items: 5,
        },
        {
          id: '3',
          customer: 'Fresh Foods Café',
          address: '789 Oak Lane, City',
          items: 2,
        },
      ],
      status: 'pending',
      distance: 12.5,
      estimated_time: 45,
    },
    {
      id: '2',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      orders: [
        {
          id: '4',
          customer: 'Produce Plus',
          address: '321 Elm St, City',
          items: 4,
        },
      ],
      status: 'pending',
      distance: 8.3,
      estimated_time: 30,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-900 text-emerald-200';
      case 'in_progress':
        return 'bg-blue-900 text-blue-200';
      case 'pending':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-slate-900 text-slate-200';
    }
  };

  const handleStartRoute = (id: string) => {
    setRoutes(
      routes.map((route) =>
        route.id === id ? { ...route, status: 'in_progress' as const } : route
      )
    );
  };

  const handleCompleteRoute = (id: string) => {
    setRoutes(
      routes.map((route) =>
        route.id === id ? { ...route, status: 'completed' as const } : route
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Delivery Routes</h1>
          <p className="text-slate-400 mt-1">Optimize and manage your delivery schedule</p>
        </div>

        {/* Routes Cards */}
        <div className="space-y-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-emerald-600 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Delivery Route - {route.date}
                  </h2>
                  <div className="flex gap-6 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {route.distance} km
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {route.estimated_time} min
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation size={16} />
                      {route.orders.length} stops
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(route.status)}`}>
                  {route.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              {/* Orders in Route */}
              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-white mb-3">Stops on this route:</h3>
                <div className="space-y-2">
                  {route.orders.map((order, idx) => (
                    <div key={order.id} className="flex items-start gap-3">
                      <span className="text-emerald-500 font-bold">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{order.customer}</p>
                        <p className="text-xs text-slate-400">{order.address}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.items} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {route.status === 'pending' && (
                  <Button
                    variant="primary"
                    onClick={() => handleStartRoute(route.id)}
                    className="flex-1"
                  >
                    Start Route
                  </Button>
                )}
                {route.status === 'in_progress' && (
                  <Button
                    variant="primary"
                    onClick={() => handleCompleteRoute(route.id)}
                    className="flex-1"
                  >
                    Complete Route
                  </Button>
                )}
                <Button variant="secondary" className="flex-1">
                  View on Map
                </Button>
                {route.status === 'completed' && (
                  <Button variant="secondary" className="flex-1">
                    View Summary
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-400">No delivery routes scheduled</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
