'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Button, Select, Input, Textarea } from '@/components/UIComponents';
import { Trash2, Plus } from 'lucide-react';
import { Customer, Product } from '@/types';

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

interface OrderItemFormData {
  product_id: string;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemFormData[]>([]);
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (newItemProductId && newItemQuantity) {
      setItems([
        ...items,
        { product_id: newItemProductId, quantity: parseFloat(newItemQuantity) },
      ]);
      setNewItemProductId('');
      setNewItemQuantity('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = PRODUCTS.find((p) => p.id === item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    setLoading(true);

    // In a real app, this would be sent to Supabase
    setTimeout(() => {
      alert('Order created successfully!');
      router.push('/orders');
    }, 1000);
  };

  const total = calculateTotal();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Create New Order</h1>
          <p className="text-slate-400 mt-1">Fill in the order details below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selection */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={[
                  { value: '', label: 'Select a customer...' },
                  ...CUSTOMERS.map((c) => ({ value: c.id, label: c.name })),
                ]}
                required
              />
              <Input
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <Textarea
              label="Notes"
              placeholder="Special delivery instructions, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-4"
            />
          </div>

          {/* Products */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Order Items</h2>

            {/* Add Item Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-700">
              <Select
                label="Product"
                value={newItemProductId}
                onChange={(e) => setNewItemProductId(e.target.value)}
                options={[
                  { value: '', label: 'Select product...' },
                  ...PRODUCTS.map((p) => ({ value: p.id, label: `${p.name} ($${p.price}/kg)` })),
                ]}
              />
              <Input
                label="Quantity (kg)"
                type="number"
                step="0.1"
                min="0"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="0"
              />
              <div className="flex">
                <Button
                  type="button"
                  variant="primary"
                  onClick={addItem}
                  className="mt-6"
                  fullWidth
                >
                  <Plus size={20} />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const product = PRODUCTS.find((p) => p.id === item.product_id);
                  const subtotal = (product?.price || 0) * item.quantity;

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-slate-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{product?.name}</p>
                        <p className="text-sm text-slate-400">
                          {item.quantity} {product?.unit} @ ${product?.price}/unit
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-lg font-bold text-emerald-400">${subtotal.toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 hover:bg-red-600 rounded text-red-400 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
            <div className="text-right">
              <p className="text-slate-300 text-sm mb-2">Order Total</p>
              <p className="text-4xl font-bold text-emerald-400">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!customerId || items.length === 0}
            >
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
