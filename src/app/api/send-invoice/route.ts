import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * API Route for sending invoice emails
 * This route handles sending invoices to customers via email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, customerName, invoice, pdfUrl } = body;

    if (!to || !customerName || !invoice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Example implementation with Resend API
    // Uncomment and configure when you have Resend API key
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.ADMIN_EMAIL || 'noreply@alchemyfruits.com',
        to,
        subject: `Invoice ${invoice.invoice_number} from Alchemy Fruit Distribution`,
        html: `
          <h1>Invoice ${invoice.invoice_number}</h1>
          <p>Dear ${customerName},</p>
          <p>Thank you for your business! Please find your invoice below.</p>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Total Amount:</strong> $${invoice.total_amount.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${invoice.due_date}</p>
          <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          ${pdfUrl ? `<p><a href="${pdfUrl}">Download Invoice PDF</a></p>` : ''}
          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>Alchemy Fruit Distribution</p>
        `,
        attachments: pdfUrl ? [{
          filename: `${invoice.invoice_number}.pdf`,
          path: pdfUrl,
        }] : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, messageId: data.id });
    */

    // Placeholder for testing
    console.log('Email would be sent to:', to);
    console.log('Invoice:', invoice.invoice_number);

    return NextResponse.json({
      success: true,
      message: 'Email queued for sending',
      email: to,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
