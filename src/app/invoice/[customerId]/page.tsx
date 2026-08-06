'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Customer, Invoice } from '@/types';
import {
  addInvoiceItem,
  createNewInvoice,
  markInvoiceAsPaid,
  markInvoiceAsUnpaid,
  removeInvoiceItem,
  updateInvoiceItem,
} from '@/lib/invoice-model';
import {
  deleteInvoice,
  getInvoice,
  listInvoicesByCustomer,
  nextInvoiceNumber,
  saveInvoice,
} from '@/app/actions/invoices';
import { createSoloCustomer, getCustomer } from '@/app/actions/customers';
import { generateInvoicePDF, downloadInvoicePDF } from '@/lib/pdf-generator';
import { sendInvoiceEmail } from '@/lib/email-service';

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
    emailInvoice: 'Email Invoice',
    emailHeading: 'Send this invoice by email',
    emailAddress: 'Customer email',
    emailMessage: 'Message (optional)',
    emailMessagePlaceholder: 'Add a note for the customer...',
    sending: 'Sending...',
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
    emailInvoice: 'Enviar por correo',
    emailHeading: 'Enviar esta factura por correo',
    emailAddress: 'Correo del cliente',
    emailMessage: 'Mensaje (opcional)',
    emailMessagePlaceholder: 'Agrega una nota para el cliente...',
    sending: 'Enviando...',
  },
};

interface PageProps {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ invoice?: string | string[] }>;
}

// /invoice/new is the solo route: an invoice for someone who isn't on the books
// yet. The customer record is created from the name typed on the invoice, the
// first time it is saved or emailed — nothing is written for an invoice that
// gets abandoned. Real ids are uuids or the seed strings '1'..'7', so this can
// never collide with a customer.
const NEW_SOLO = 'new';

function recalcInvoice(invoice: Invoice): Invoice {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const totalDue = Math.max(0, subtotal - invoice.discount);
  return {
    ...invoice,
    subtotal,
    totalDue,
  };
}

// The Total box shows a plain number the owner can retype. String(140) is "140",
// not "140.00", so there's no stray zero to delete before typing a new amount.
function formatTotal(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isFinite(rounded) ? String(rounded) : '';
}

export default function InvoicePage({ params, searchParams }: PageProps) {
  const [customerId, setCustomerId] = useState<string>('');
  const [requestedInvoiceId, setRequestedInvoiceId] = useState<string | null>(null);
  const [routeReady, setRouteReady] = useState(false);
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
  const [customerMissing, setCustomerMissing] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; text: string } | null>(null);
  // What's typed in the Total box. Kept separate from the invoice so typing —
  // including clearing it or a half-finished "12." — shows exactly as entered.
  const [totalDraft, setTotalDraft] = useState('');
  const [totalFocused, setTotalFocused] = useState(false);
  // Read from the database now, so it has to be state rather than a lookup
  // during render.
  const [customerRecord, setCustomerRecord] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  // On the solo route this fills in once the customer has been created, so
  // everything downstream — history, saving again — works on a real id.
  const [soloCustomerId, setSoloCustomerId] = useState('');
  const isSolo = customerId === NEW_SOLO;
  const activeCustomerId = isSolo ? soloCustomerId : customerId;

  // Empty until a solo customer exists, which is also when they have no
  // history to list.
  const loadHistory = async (): Promise<Invoice[]> =>
    activeCustomerId ? listInvoicesByCustomer(activeCustomerId) : [];

  // Resolved together so the saved invoice named in `?invoice=` is known before
  // the effect below decides between loading it and starting a blank one.
  useEffect(() => {
    Promise.all([params, searchParams]).then(([resolvedParams, resolvedSearch]) => {
      setCustomerId(resolvedParams.customerId);
      setRequestedInvoiceId(
        typeof resolvedSearch.invoice === 'string' ? resolvedSearch.invoice : null
      );
      setRouteReady(true);
    });
  }, [params, searchParams]);

  useEffect(() => {
    if (!routeReady || !customerId) return;

    let cancelled = false;

    (async () => {
      try {
        // A solo invoice starts blank: no customer to look up, no history to
        // show, and the name boxes waiting to be filled in.
        if (isSolo) {
          const invoiceNumber = await nextInvoiceNumber();
          if (cancelled) return;

          setPreviousInvoices([]);
          setInvoice(createNewInvoice(invoiceNumber, '', '', '', '', ''));
          setSelectedInvoiceId(null);
          return;
        }

        const [history, customer] = await Promise.all([
          listInvoicesByCustomer(customerId),
          getCustomer(customerId),
        ]);
        if (cancelled) return;

        setPreviousInvoices(history);
        setCustomerRecord(customer ?? null);
        // Prefilled as a starting point only — whatever is in the box at send
        // time is the address that gets the invoice.
        setEmailTo(customer?.email ?? '');

        // A saved invoice carries its own customer name, city, and address, so
        // it opens even after that customer is removed from the list.
        const requested = requestedInvoiceId ? await getInvoice(requestedInvoiceId) : undefined;
        if (cancelled) return;

        if (requested) {
          setInvoice(requested);
          setSelectedInvoiceId(requested.id);
          return;
        }

        // Only a blank invoice needs the customer record to start from.
        if (!customer) {
          setCustomerMissing(true);
          return;
        }

        const invoiceNumber = await nextInvoiceNumber();
        if (cancelled) return;

        setInvoice(
          createNewInvoice(
            invoiceNumber,
            customerId,
            customer.name,
            customer.city,
            customer.address ?? '',
            ''
          )
        );
        setSelectedInvoiceId(null);
      } catch (error: unknown) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Could not load this customer.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeReady, customerId, requestedInvoiceId, isSolo]);

  useEffect(() => {
    const map: Record<string, string> = {
      'Lulo Fruit': 'Small sweet seasonal fruit, ripe and ready',
      'Tomate de arbol': 'Highland tree tomato, tangy and firm',
    };
    setCurrentDescription(map[currentFruit] ?? '');
  }, [currentFruit]);

  // Keep the Total box in step with the invoice's total — when items change, a
  // different invoice loads, or the form is cleared — but never while it's being
  // edited, so syncing can't yank a number out from under someone mid-type.
  useEffect(() => {
    if (!invoice || totalFocused) return;
    setTotalDraft(formatTotal(invoice.totalDue));
  }, [invoice?.totalDue, totalFocused]);

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

  if (customerMissing) {
    return (
      <div className="theme-dark min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">That customer no longer exists.</p>
        <Link href="/">
          <button className="btn btn-secondary">← Back to Customers</button>
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="theme-dark min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-red-300">{loadError}</p>
        <Link href="/">
          <button className="btn btn-secondary">← Back to Customers</button>
        </Link>
      </div>
    );
  }

  if (!customerId || !invoice) {
    return (
      <div className="theme-dark min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  // Falls back to the invoice's own snapshot, so a deleted customer still
  // renders the invoice they were billed on.
  const customer: { name: string; city: string; address?: string } = customerRecord ?? {
    name: invoice.customerName,
    city: invoice.customerCity,
    address: invoice.customerAddress,
  };
  const t = LABELS[language];

  const updateInvoice = (updated: Invoice) => {
    setInvoice(recalcInvoice(updated));
  };

  /**
   * An invoice has to belong to a customer, and a solo one doesn't have a
   * customer until now. Creates them from the name on the invoice and hands
   * back the invoice pointing at them; for everyone else it changes nothing.
   */
  const withCustomer = async (current: Invoice): Promise<Invoice> => {
    if (current.customerId) return current;

    const result = await createSoloCustomer({
      name: current.customerName,
      city: current.customerCity,
      address: current.customerAddress,
    });

    if (result.error || !result.customerId) {
      throw new Error(result.error ?? 'Could not save this customer.');
    }

    setSoloCustomerId(result.customerId);
    const linked = { ...current, customerId: result.customerId };
    setInvoice(linked);
    return linked;
  };

  const handleSaveInvoice = () => {
    if (!invoice) return;
    if (invoice.items.length === 0) {
      window.alert('Please add at least one item');
      return;
    }

    startSaving(async () => {
      try {
        // The saved copy comes back with the totals the database calculated,
        // which are the authoritative ones.
        const saved = await saveInvoice(await withCustomer(invoice));
        setInvoice(saved);
        setPreviousInvoices(await loadHistory());
        setSelectedInvoiceId(saved.id);
        window.alert(`Invoice ${saved.invoiceNumber} saved successfully!`);
      } catch (error: unknown) {
        window.alert(
          error instanceof Error ? error.message : 'Could not save the invoice. Nothing was saved.'
        );
      }
    });
  };

  const handleSetPaid = (paid: boolean) => {
    if (!invoice) return;

    startSaving(async () => {
      try {
        const ready = await withCustomer(invoice);
        const saved = await saveInvoice(
          paid ? markInvoiceAsPaid(ready) : markInvoiceAsUnpaid(ready)
        );
        setInvoice(saved);
        setSelectedInvoiceId(saved.id);
        setPreviousInvoices(await loadHistory());
      } catch (error: unknown) {
        window.alert(
          error instanceof Error ? error.message : 'Could not update the invoice status.'
        );
      }
    });
  };

  const handleDeleteSavedInvoice = (invoiceId: string) => {
    if (!window.confirm('Delete this saved invoice?')) return;

    startSaving(async () => {
      try {
        await deleteInvoice(invoiceId);
        setPreviousInvoices(await loadHistory());
        if (selectedInvoiceId === invoiceId) {
          setSelectedInvoiceId(null);
        }
      } catch (error: unknown) {
        window.alert(error instanceof Error ? error.message : 'Could not delete the invoice.');
      }
    });
  };

  const handleDeleteCurrentInvoice = () => {
    if (!invoice) return;
    const invoiceIdToDelete = selectedInvoiceId || invoice.id;
    if (!window.confirm('Delete this invoice?')) return;

    startSaving(async () => {
      try {
        await deleteInvoice(invoiceIdToDelete);
        setPreviousInvoices(await loadHistory());
        setInvoice(
          createNewInvoice(
            await nextInvoiceNumber(),
            activeCustomerId,
            customer.name,
            customer.city,
            customer.address ?? '',
            ''
          )
        );
        setSelectedInvoiceId(null);
      } catch (error: unknown) {
        window.alert(error instanceof Error ? error.message : 'Could not delete the invoice.');
      }
    });
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

  const handleEmailInvoice = async () => {
    if (!invoice) return;

    const recipient = emailTo.trim();
    if (!recipient) {
      setEmailStatus({ ok: false, text: 'Enter an email address to send to.' });
      return;
    }
    if (invoice.items.length === 0) {
      setEmailStatus({ ok: false, text: 'Add at least one item before sending.' });
      return;
    }

    setEmailSending(true);
    setEmailStatus(null);
    try {
      // Emailing used to leave nothing behind: an invoice could reach the
      // customer and disappear when the page closed. Saving first means
      // anything a customer has received is also in the history.
      let sending = invoice;
      try {
        sending = await saveInvoice(await withCustomer(invoice));
        setInvoice(sending);
        setSelectedInvoiceId(sending.id);
        setPreviousInvoices(await loadHistory());
      } catch {
        // A database hiccup shouldn't hold the customer's invoice hostage. The
        // send still goes ahead, and the sent-email log keeps its own full copy
        // of whatever went out, so the order is recorded either way.
      }

      await sendInvoiceEmail(recipient, sending, emailMessage);
      setEmailStatus({ ok: true, text: `Invoice ${invoice.invoiceNumber} sent to ${recipient}.` });
      setEmailMessage('');
    } catch (error) {
      setEmailStatus({
        ok: false,
        text: error instanceof Error ? error.message : 'Could not send the invoice.',
      });
    } finally {
      setEmailSending(false);
    }
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
    startSaving(async () => {
      const newInvoice = createNewInvoice(
        await nextInvoiceNumber(),
        activeCustomerId,
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
    });
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
            {isSolo && (
              <Link href="/solo/list">
                <button className="btn btn-secondary">Past solo customers</button>
              </Link>
            )}
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Total</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input"
                    value={totalDraft}
                    placeholder="0.00"
                    onFocus={() => setTotalFocused(true)}
                    onBlur={() => setTotalFocused(false)}
                    onChange={(e) => {
                      // Strip any leading zero as it's typed so "0" + "1245" reads
                      // as "1245", not "01245".
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setTotalDraft(raw);
                      // The typed total is stored as the gap between the items'
                      // subtotal and this number (the invoice's "discount"), so the
                      // database — which always recomputes total_due as subtotal
                      // minus discount — lands on exactly this amount. A total above
                      // the subtotal makes that gap negative, i.e. an increase.
                      const total = Math.max(0, parseFloat(raw) || 0);
                      const discount = Math.round((invoice.subtotal - total) * 100) / 100;
                      updateInvoice({ ...invoice, discount });
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Starts at the sum of the items above. Type any amount to set the total yourself.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 mb-8">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
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

              <div className="border-t border-slate-700 mt-8 pt-6">
                <h3 className="text-lg font-bold mb-4">{t.emailHeading}</h3>
                <div className="grid gap-4">
                  <div>
                    <label htmlFor="invoice-email" className="block text-sm font-medium text-slate-300 mb-2">
                      {t.emailAddress}
                    </label>
                    <input
                      id="invoice-email"
                      type="email"
                      className="input"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="customer@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="invoice-email-message" className="block text-sm font-medium text-slate-300 mb-2">
                      {t.emailMessage}
                    </label>
                    <input
                      id="invoice-email-message"
                      type="text"
                      className="input"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder={t.emailMessagePlaceholder}
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full sm:w-auto"
                    onClick={handleEmailInvoice}
                    disabled={emailSending}
                  >
                    {emailSending ? t.sending : t.emailInvoice}
                  </button>
                  {emailStatus && (
                    <p
                      role="status"
                      className={`text-sm ${emailStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {emailStatus.text}
                    </p>
                  )}
                </div>
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
                  disabled={saving}
                  onClick={() => handleSetPaid(true)}
                >
                  {t.markAsPaid}
                </button>
                {invoice.status === 'paid' && (
                  <button
                    className="btn btn-secondary w-full"
                    disabled={saving}
                    onClick={() => handleSetPaid(false)}
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
