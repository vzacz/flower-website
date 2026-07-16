import { Invoice } from '@/types';
import { generateInvoicePDF } from '@/lib/pdf-generator';

/**
 * Render the invoice PDF and hand back just the base64 payload. jsPDF gives a
 * full data URI, and Resend wants the bytes without the `data:...;base64,` prefix.
 */
function invoicePdfAsBase64(invoice: Invoice): string {
  const dataUri = generateInvoicePDF(invoice).output('datauristring');
  return dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length);
}

/**
 * Email an invoice to a customer, with the same PDF the Download button produces
 * attached. Throws with the server's explanation so the caller can show it.
 */
export async function sendInvoiceEmail(
  customerEmail: string,
  invoice: Invoice,
  message?: string
): Promise<{ success: true; id: string; to: string }> {
  const response = await fetch('/api/send-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: customerEmail,
      invoice,
      message: message?.trim() || undefined,
      pdfBase64: invoicePdfAsBase64(invoice),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Failed to send invoice email (${response.status})`);
  }

  return data;
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
