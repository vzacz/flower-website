'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button, Input, Textarea } from '@/components/UIComponents';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Restaurant La Bella',
      email: 'contact@labella.com',
      phone: '555-0100',
      city: 'San Jose',
      address: '123 Main St, City, State',
      notes: 'Prefers morning deliveries',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Market Central',
      email: 'info@marketcentral.com',
      phone: '555-0101',
      city: 'San Francisco',
      address: '456 Market Ave, City, State',
      notes: 'Large orders, flexible schedule',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      setCustomers(
        customers.map((c) =>
          c.id === editingId
            ? { ...c, ...formData, updated_at: new Date().toISOString() }
            : c
        )
      );
      setEditingId(null);
    } else {
      const newCustomer: Customer = {
        id: Math.random().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCustomers([...customers, newCustomer]);
    }

    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      city: customer.city ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Customers</h1>
            <p className="text-slate-400 mt-1">Manage your customer information</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                city: '',
                address: '',
                notes: '',
              });
              setShowForm(true);
            }}
          >
            <Plus size={20} />
            Add Customer
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-emerald-600 transition-all"
            >
              <h3 className="text-lg font-bold text-white mb-2">{customer.name}</h3>
              <div className="space-y-2 text-sm text-slate-400 mb-4">
                <p>📧 {customer.email}</p>
                <p>📱 {customer.phone}</p>
                <p>📍 {customer.address}</p>
                {customer.notes && <p className="text-slate-500 italic">"{customer.notes}"</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-400">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
