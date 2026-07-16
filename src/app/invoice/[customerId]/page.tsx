'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Invoice } from '@/types';
import {
  addInvoiceItem,
  createNewInvoice,
  deleteInvoice,
  getInvoicesByCustomerId,
  markInvoiceAsPaid,
  markInvoiceAsUnpaid,
  saveInvoice,
  removeInvoiceItem,
  updateInvoiceItem,
} from '@/lib/invoice-storage';
import { generateInvoicePDF, downloadInvoicePDF } from '@/lib/pdf-generator';

const CUSTOMERS: Record<string, { name: string; city: string; address?: string }> = {
  '1': { name: 'El Chaparral', city: 'San Jose', address: '123 Main Street' },
  '2': { name: 'Mi Ranchito Sunnyvale', city: 'Sunnyvale', address: '456 Sunnyvale Ave' },
  '3': { name: 'Mi Ranchito Market San Jose', city: 'San Jose', address: '789 Market Blvd' },
  '4': { name: 'Olala Campbell', city: 'Campbell', address: '101 Orchard Lane' },
  '5': { name: 'Ayyar South San Francisco', city: 'South San Francisco', address: '202 Bay Street' },
  '6': { name: "Mina's Cafe Foster City", city: 'Foster City', address: '303 Cafe Plaza' },
  '7': { name: 'La Prada San Jose', city: 'San Jose', address: '404 Garden Road' },
};

const FRUITS = ['Lulo Fruit', 'Tomate de arbol'];

const LABELS = {
  en: {
    title: 'Create Invoice',
    customerSearch: 'Search by customer',
    invoiceNumberSearch: 'Search by invoice #',
    dateSearch: 'Search by date',
    invoiceHistory: 'Invoice History',
    noInvoices: 'No saved invoices for this customer yet.',
    addItem: 'Add Item',
    updateItem: 'Update Item',
    saveInvoice: 'Save Invoice',
    editInvoice: 'Edit Invoice',
    deleteInvoice: 'Delete Invoice',
    printInvoice: 'Print Invoice',
    downloadPDF: 'Download as PDF',
    clearForm: 'Clear Form',
    createNewInvoice: 'Create New Invoice',
    markAsPaid: 'Mark as Paid',
    markAsUnpaid: 'Mark as Unpaid',
  },
  es: {
    title: 'Crear factura',
    customerSearch: 'Buscar por cliente',
    invoiceNumberSearch: 'Buscar por factura #',
    dateSearch: 'Buscar por fecha',
    invoiceHistory: 'Historial de facturas',
    noInvoices: 'Aun no hay facturas guardadas para este cliente.',
    addItem: 'Agregar articulo',
    updateItem: 'Actualizar articulo',
    saveInvoice: 'Guardar factura',
    editInvoice: 'Editar factura',
    deleteInvoice: 'Eliminar factura',
    printInvoice: 'Imprimir factura',
    downloadPDF: 'Descargar PDF',
    clearForm: 'Borrar formulario',
    createNewInvoice: 'Crear nueva factura',
    markAsPaid: 'Marcar como pagado',
    markAsUnpaid: 'Marcar como no pagado',
  },
};

interface PageProps {
  params: Promise<{ customerId: string }>;
}

function recalcInvoice(invoice: Invoice): Invoice {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const totalDue = Math.max(0, subtotal - invoice.discount);
  return {
    ...invoice,
    subtotal,
    totalDue,
  };
}

export default function InvoicePage({ params }: PageProps) {
  const [customerId, setCustomerId] = useState<string>('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [previousInvoices, setPreviousInvoices] = useState<Invoice[]>([]);
  const [currentFruit, setCurrentFruit] = useState(FRUITS[0]);
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    params.then((p) => setCustomerId(p.customerId));
  }, [params]);

  useEffect(() => {
    if (!customerId || !CUSTOMERS[customerId]) return;

    const customer = CUSTOMERS[customerId];
    const invoices = getInvoicesByCustomerId(customerId);
    setPreviousInvoices(invoices);

    const startingInvoice = createNewInvoice(
      customerId,
      customer.name,
      customer.city,
      customer.address ?? '',
      ''
    );
    setInvoice(startingInvoice);
    setSelectedInvoiceId(null);
  }, [customerId]);

  useEffect(() => {
    const map: Record<string, string> = {
      'Lulo Fruit': 'Small sweet seasonal fruit, ripe and ready',
      'Tomate de arbol': 'Highland tree tomato, tangy and firm',
    };
    setCurrentDescription(map[currentFruit] ?? '');
  }, [currentFruit]);

  const historyInvoices = useMemo(() => {
    return previousInvoices.filter((item) => {
      const matchCustomer = searchCustomer
        ? item.customerName.toLowerCase().includes(searchCustomer.toLowerCase())
        : true;
      const matchInvoice = searchInvoiceNumber
        ? item.invoiceNumber.toLowerCase().includes(searchInvoiceNumber.toLowerCase())
        : true;
      const matchDate = searchDate ? item.date === searchDate : true;
      return matchCustomer && matchInvoice && matchDate;
    });
  }, [previousInvoices, searchCustomer, searchInvoiceNumber, searchDate]);

  if (!customerId || !invoice) {
    return (
      <div className="theme-dark min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const customer = CUSTOMERS[customerId];
  const t = LABELS[language];

  const updateInvoice = (updated: Invoice) => {
    setInvoice(recalcInvoice(updated));
  };

  const handleSaveInvoice = () => {
    if (!invoice) return;
    if (invoice.items.length === 0) {
      window.alert('Please add at least one item');
      return;
    }
    const saved = saveInvoice(invoice);
    setInvoice(saved);
    setPreviousInvoices(getInvoicesByCustomerId(customerId));
    setSelectedInvoiceId(saved.id);
    window.alert(`Invoice ${saved.invoiceNumber} saved successfully!`);
  };

  const handleDeleteSavedInvoice = (invoiceId: string) => {
    if (!window.confirm('Delete this saved invoice?')) return;
    deleteInvoice(invoiceId);
    const updatedList = getInvoicesByCustomerId(customerId);
    setPreviousInvoices(updatedList);
    if (selectedInvoiceId === invoiceId) {
      setSelectedInvoiceId(null);
    }
  };

  const handleDeleteCurrentInvoice = () => {
    if (!invoice) return;
    const invoiceIdToDelete = selectedInvoiceId || invoice.id;
    if (!window.confirm('Delete this invoice?')) return;
    deleteInvoice(invoiceIdToDelete);
    const updatedList = getInvoicesByCustomerId(customerId);
    setPreviousInvoices(updatedList);
    const newInvoice = createNewInvoice(
      customerId,
      customer.name,
      customer.city,
      customer.address ?? '',
      ''
    );
    setInvoice(newInvoice);
    setSelectedInvoiceId(null);
  };

  const handleLoadInvoice = () => {
    if (!selectedInvoiceId) {
      window.alert('Select an invoice from history to edit.');
      return;
    }

    const savedInvoice = previousInvoices.find((item) => item.id === selectedInvoiceId);
    if (savedInvoice) {
      setInvoice(savedInvoice);
    }
  };

  const handlePrintInvoice = () => {
    if (!invoice || invoice.items.length === 0) {
      window.alert('Please add items before printing');
      return;
    }
    const doc = generateInvoicePDF(invoice);
    const url = doc.output('bloburl');
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!invoice || invoice.items.length === 0) {
      window.alert('Please add items before downloading');
      return;
    }
    const pdf = generateInvoicePDF(invoice);
    downloadInvoicePDF(pdf, invoice.invoiceNumber);
  };

  const handleAddOrUpdateItem = () => {
    if (!invoice) return;
    const quantity = parseFloat(currentQuantity);
    const price = parseFloat(currentPrice);
    if (!currentFruit || !currentQuantity || !currentPrice || quantity <= 0 || price <= 0) {
      window.alert('Please fill in all item fields with valid numbers.');
      return;
    }

    let updated = invoice;
    if (editingItemId) {
      updated = updateInvoiceItem(invoice, editingItemId, currentDescription, quantity, price);
      setEditingItemId(null);
    } else {
      updated = addInvoiceItem(invoice, currentFruit, currentDescription, quantity, price);
    }

    updateInvoice(updated);
    setCurrentFruit(FRUITS[0]);
    setCurrentQuantity('');
    setCurrentPrice('');
    setCurrentDescription('');
  };

  const handleClearForm = () => {
    if (!invoice) return;
    updateInvoice({
      ...invoice,
      items: [],
      subtotal: 0,
      discount: 0,
      totalDue: 0,
      customerAddress: '',
      notes: '',
    });
    setCurrentFruit(FRUITS[0]);
    setCurrentQuantity('');
    setCurrentPrice('');
    setCurrentDescription('');
    setEditingItemId(null);
    setSelectedInvoiceId(null);
  };

  const handleCreateNewInvoice = () => {
    const newInvoice = createNewInvoice(
      customerId,
      customer.name,
      customer.city,
      customer.address ?? '',
      ''
    );
    setInvoice(newInvoice);
    setCurrentFruit(FRUITS[0]);
    setCurrentQuantity('');
    setCurrentPrice('');
    setCurrentDescription('');
    setEditingItemId(null);
    setSelectedInvoiceId(null);
  };

  return (
    <div className="theme-dark min-h-screen bg-slate-900 text-slate-100">
      <div className="header">
        <div className="container flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div>
            <h1 className="text-4xl font-bold">LA FRUTA</h1>
            <p className="text-white/90 mt-1">Fruit business invoice system</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/">
              <button className="btn btn-secondary">← Back to Customers</button>
            </Link>
            <button className="btn btn-light" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}>
              {language === 'en' ? 'Espanol' : 'English'}
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="invoice-grid gap-6">
          <div>
            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t.title}</h2>
                  <p className="text-slate-400 mt-1">{customer.name}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button className="btn btn-secondary" onClick={handleCreateNewInvoice}>{t.createNewInvoice}</button>
                  <button className="btn btn-secondary" onClick={handleClearForm}>{t.clearForm}</button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 mb-8">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Invoice Number</p>
                  <p className="text-lg font-bold text-slate-100">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Date</p>
                  <input
                    type="date"
                    className="input"
                    value={invoice.date}
                    onChange={(e) => updateInvoice({ ...invoice, date: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Customer Name</p>
                  <input
                    type="text"
                    className="input"
                    value={invoice.customerName}
                    onChange={(e) => updateInvoice({ ...invoice, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Location</p>
                  <input
                    type="text"
                    className="input"
                    value={invoice.customerCity}
                    onChange={(e) => updateInvoice({ ...invoice, customerCity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Address</p>
                  <input
                    type="text"
                    className="input"
                    value={invoice.customerAddress}
                    onChange={(e) => updateInvoice({ ...invoice, customerAddress: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Notes</p>
                  <input
                    type="text"
                    className="input"
                    value={invoice.notes}
                    onChange={(e) => updateInvoice({ ...invoice, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6 mb-6">
                <h3 className="text-lg font-bold mb-4">{t.addItem}</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Fruit</label>
                    <select className="select" value={currentFruit} onChange={(e) => setCurrentFruit(e.target.value)}>
                      {FRUITS.map((fruit) => (
                        <option key={fruit} value={fruit}>{fruit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <input
                      type="text"
                      className="input"
                      value={currentDescription}
                      onChange={(e) => setCurrentDescription(e.target.value)}
                      placeholder="Custom description"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                      <input
                        type="number"
                        className="input"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(e.target.value)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Price per box</label>
                      <input
                        type="number"
                        className="input"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddOrUpdateItem}>
                    {editingItemId ? t.updateItem : t.addItem}
                  </button>
                </div>
              </div>

              <div className="items-table-wrap mb-6">
                <table className="items-table text-sm w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-700">
                      <th className="text-left py-2 px-2 font-bold">Quantity</th>
                      <th className="text-left py-2 px-2 font-bold">Fruit</th>
                      <th className="text-left py-2 px-2 font-bold">Description</th>
                      <th className="text-right py-2 px-2 font-bold">Price per box</th>
                      <th className="text-right py-2 px-2 font-bold">Amount</th>
                      <th className="text-center py-2 px-2 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">Add items to start the receipt.</td>
                      </tr>
                    ) : (
                      invoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800">
                          <td className="py-3 px-2 w-24">
                            <input
                              type="number"
                              className="input"
                              value={item.quantity}
                              min="0"
                              step="0.5"
                              onChange={(e) => {
                                const quantity = parseFloat(e.target.value) || 0;
                                updateInvoice(updateInvoiceItem(invoice, item.id, item.description, quantity, item.pricePerBox));
                              }}
                            />
                          </td>
                          <td className="py-3 px-2 w-44">
                            <select
                              className="select"
                              value={item.fruit}
                              onChange={(e) => {
                                const updatedItems = invoice.items.map((row) =>
                                  row.id === item.id ? { ...row, fruit: e.target.value } : row
                                );
                                updateInvoice({ ...invoice, items: updatedItems });
                              }}
                            >
                              {FRUITS.map((fruit) => (
                                <option key={fruit} value={fruit}>{fruit}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              className="input"
                              value={item.description ?? ''}
                              onChange={(e) => updateInvoice(updateInvoiceItem(invoice, item.id, e.target.value, item.quantity, item.pricePerBox))}
                            />
                          </td>
                          <td className="py-3 px-2 w-32 text-right">
                            <input
                              type="number"
                              className="input"
                              value={item.pricePerBox.toFixed(2)}
                              min="0"
                              step="0.01"
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                updateInvoice(updateInvoiceItem(invoice, item.id, item.description, item.quantity, price));
                              }}
                            />
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">${item.amount.toFixed(2)}</td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => {
                                setCurrentFruit(item.fruit);
                                setCurrentQuantity(item.quantity.toString());
                                setCurrentPrice(item.pricePerBox.toString());
                                setCurrentDescription(item.description ?? '');
                                setEditingItemId(item.id);
                              }}
                              className="text-blue-400 hover:text-blue-300 font-medium mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => updateInvoice(removeInvoiceItem(invoice, item.id))}
                              className="text-red-400 hover:text-red-300 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Discount</label>
                  <input
                    type="number"
                    className="input"
                    value={invoice.discount}
                    min="0"
                    step="0.01"
                    onChange={(e) => updateInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid gap-2 mb-8">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Discount</span>
                  <span>-${invoice.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-700 text-lg font-bold">
                  <span>Final total</span>
                  <span>${invoice.totalDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button className="btn btn-primary" onClick={handleSaveInvoice}>{t.saveInvoice}</button>
                <button className="btn btn-secondary" onClick={handleLoadInvoice}>{t.editInvoice}</button>
                <button className="btn btn-secondary" onClick={handleDeleteCurrentInvoice}>{t.deleteInvoice}</button>
                <button className="btn btn-secondary" onClick={handlePrintInvoice}>{t.printInvoice}</button>
                <button className="btn btn-secondary" onClick={handleDownloadPDF}>{t.downloadPDF}</button>
              </div>
            </div>
          </div>

          <div className="grid gap-6" style={{ gridAutoRows: 'max-content' }}>
            <div className="rounded-3xl border-2 border-emerald-700 bg-emerald-900/20 p-6 shadow-lg">
              <p className="text-sm text-slate-400 mb-2">Current total</p>
              <p className="text-4xl font-bold text-emerald-400">${invoice.totalDue.toFixed(2)}</p>
              <p className="text-sm text-slate-400 mt-4">{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</p>
              <div className="mt-6 grid gap-2">
                <button
                  className="btn btn-light w-full"
                  onClick={() => {
                    const paidInvoice = markInvoiceAsPaid(invoice);
                    const saved = saveInvoice(paidInvoice);
                    setInvoice(saved);
                    setPreviousInvoices(getInvoicesByCustomerId(customerId));
                  }}
                >
                  {t.markAsPaid}
                </button>
                {invoice.status === 'paid' && (
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() => {
                      const unpaidInvoice = markInvoiceAsUnpaid(invoice);
                      const saved = saveInvoice(unpaidInvoice);
                      setInvoice(saved);
                      setPreviousInvoices(getInvoicesByCustomerId(customerId));
                    }}
                  >
                    {t.markAsUnpaid}
                  </button>
                )}
              </div>
              <div className="mt-4 text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${invoice.status === 'paid' ? 'badge-success' : 'badge-error'}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{t.invoiceHistory}</h3>
                <span className="text-sm text-slate-400">{previousInvoices.length} saved</span>
              </div>
              <div className="grid gap-3 mb-4">
                <input
                  type="text"
                  className="input"
                  placeholder={t.customerSearch}
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder={t.invoiceNumberSearch}
                  value={searchInvoiceNumber}
                  onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                />
                <input
                  type="date"
                  className="input"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                {historyInvoices.length === 0 ? (
                  <p className="text-sm text-slate-400">{t.noInvoices}</p>
                ) : (
                  historyInvoices.map((prev) => (
                    <div
                      key={prev.id}
                      className={`history-item w-full p-3 rounded-lg border ${selectedInvoiceId === prev.id ? 'border-emerald-500 bg-emerald-900/30' : 'border-slate-700 bg-slate-800'} hover:border-emerald-400`}
                    >
                      <button
                        type="button"
                        className="history-item-button text-left"
                        onClick={() => setSelectedInvoiceId(prev.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-100">{prev.invoiceNumber}</p>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${prev.status === 'paid' ? 'badge-success' : 'badge-error'}`}>
                            {prev.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{prev.date}</p>
                        <p className="text-sm font-bold text-slate-100 mt-1">${prev.totalDue.toFixed(2)}</p>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary history-delete"
                        onClick={() => handleDeleteSavedInvoice(prev.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
