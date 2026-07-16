import { Invoice } from '@/types';

/**
 * Send invoice via email using Resend or alternative email service
 * This is a template that can be integrated with your email provider
 */
export async function sendInvoiceEmail(
  customerEmail: string,
  customerName: string,
  invoice: Invoice,
  invoicePdfUrl?: string
) {
  try {
    const response = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: customerEmail,
        customerName,
        invoice,
        pdfUrl: invoicePdfUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send invoice email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

/**
 * Format invoice email content
 */
export function formatInvoiceEmailContent(
  customerName: string,
  invoiceNumber: string,
  total: number,
  dueDate: string
) {
  return `
Dear ${customerName},

Thank you for your business! Your invoice is ready.

Invoice Number: ${invoiceNumber}
Total Amount: $${total.toFixed(2)}
Due Date: ${dueDate}

Please find your detailed invoice attached to this email.

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
Alchemy Fruit Distribution
  `;
}

/**
 * Send payment received notification
 */
export async function sendPaymentNotification(
  customerEmail: string,
  customerName: string,
  invoiceNumber: string,
  amountPaid: number
) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: customerEmail,
        type: 'payment_received',
        data: {
          customerName,
          invoiceNumber,
          amountPaid,
        },
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending payment notification:', error);
    throw error;
  }
}
