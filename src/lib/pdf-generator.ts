import jsPDF from 'jspdf';
import { Invoice } from '@/types';

export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  doc.setFontSize(24);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('LA FRUTA', 15, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 15, 15, { align: 'right' });
  doc.text(`Date: ${invoice.date}`, pageWidth - 15, 21, { align: 'right' });

  y += 12;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Customer', 15, y);
  y += 6;
  doc.text(invoice.customerName, 15, y);
  y += 5;
  doc.text(invoice.customerAddress || 'Address not set', 15, y);
  y += 5;
  doc.text(invoice.customerCity, 15, y);
  y += 8;

  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Notes: ${invoice.notes}`, 15, y);
    y += 8;
  }

  const tableX = 15;
  const tableWidth = pageWidth - 30;

  doc.setFillColor(5, 150, 105);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.rect(tableX, y - 5, tableWidth, 8, 'F');
  doc.text('Fruit', tableX + 3, y);
  doc.text('Qty', tableX + 80, y);
  doc.text('Price/Box', tableX + 110, y);
  doc.text('Amount', tableX + 150, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  invoice.items.forEach((item, index) => {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(245, 251, 245);
      doc.rect(tableX, y - 4, tableWidth, 7.5, 'F');
    }

    doc.text(item.fruit, tableX + 3, y);
    doc.text(item.quantity.toString(), tableX + 80, y);
    doc.text(`$${item.pricePerBox.toFixed(2)}`, tableX + 110, y);
    doc.text(`$${item.amount.toFixed(2)}`, tableX + 150, y);
    y += 7;

    if (item.description) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(item.description, tableX + 3, y);
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    }
  });

  y += 8;
  const totalX = tableX + 110;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', totalX, y);
  doc.setTextColor(0, 0, 0);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, totalX + 35, y, { align: 'right' });
  y += 6;

  doc.setTextColor(100, 100, 100);
  doc.text('Discount:', totalX, y);
  doc.setTextColor(0, 0, 0);
  doc.text(`$${invoice.discount.toFixed(2)}`, totalX + 35, y, { align: 'right' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Total Due:', totalX, y);
  doc.text(`$${invoice.totalDue.toFixed(2)}`, totalX + 35, y, { align: 'right' });

  y += 12;
  const isPaid = invoice.status === 'paid';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isPaid ? 5 : 220, isPaid ? 150 : 38, isPaid ? 105 : 38);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, y);

  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('LA FRUTA • Simple receipt styled for your fruit business', 15, pageHeight - 12);

  return doc;
}

export function downloadInvoicePDF(doc: jsPDF, invoiceNumber: string): void {
  doc.save(`${invoiceNumber}.pdf`);
}

