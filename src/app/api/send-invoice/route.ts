import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

// An invoice PDF is a few KB. This only exists so a malformed body can't push a
// huge attachment upstream.
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const itemSchema = z.object({
  fruit: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  pricePerBox: z.number(),
  amount: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  items: z.array(itemSchema),
  subtotal: z.number(),
  discount: z.number(),
  totalDue: z.number(),
  status: z.enum(['unpaid', 'paid']),
});

const bodySchema = z.object({
  to: z.email(),
  invoice: invoiceSchema,
  message: z.string().max(2000).optional(),
  pdfBase64: z.string().optional(),
});

type InvoicePayload = z.infer<typeof invoiceSchema>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function buildHtml(invoice: InvoicePayload, message?: string): string {
  const rows = invoice.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.fruit)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.description ?? '')}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(item.pricePerBox)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(item.amount)}</td>
        </tr>`
    )
    .join('');

  return `
  <div style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;max-width:640px;">
    <h1 style="color:#059669;margin-bottom:4px;">LA FRUTA</h1>
    <p style="color:#64748b;margin-top:0;">Invoice ${escapeHtml(invoice.invoiceNumber)} &middot; ${escapeHtml(invoice.date)}</p>
    <p>Hello ${escapeHtml(invoice.customerName)},</p>
    ${
      message
        ? `<p>${escapeHtml(message)}</p>`
        : '<p>Your invoice is ready. The details are below, and the full invoice is attached as a PDF.</p>'
    }
    <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;">
      <thead>
        <tr style="background:#f1f5f9;text-align:left;">
          <th style="padding:8px;">Fruit</th>
          <th style="padding:8px;">Description</th>
          <th style="padding:8px;text-align:right;">Qty</th>
          <th style="padding:8px;text-align:right;">Price/box</th>
          <th style="padding:8px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:2px 0;color:#64748b;">Subtotal: ${money(invoice.subtotal)}</p>
    <p style="margin:2px 0;color:#64748b;">Discount: -${money(invoice.discount)}</p>
    <p style="margin:10px 0;font-size:18px;font-weight:bold;">Final total: ${money(invoice.totalDue)}</p>
    <p style="color:${invoice.status === 'paid' ? '#059669' : '#dc2626'};font-weight:bold;">
      ${invoice.status.toUpperCase()}
    </p>
    ${invoice.notes ? `<p style="color:#64748b;">Notes: ${escapeHtml(invoice.notes)}</p>` : ''}
    <p style="color:#94a3b8;font-size:12px;margin-top:28px;">LA FRUTA &middot; Thank you for your business.</p>
  </div>`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL || process.env.ADMIN_EMAIL;

  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          'Email is not set up yet. Add RESEND_API_KEY and INVOICE_FROM_EMAIL to .env.local and restart the dev server.',
      },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { to, invoice, message, pdfBase64 } = parsed.data;

  if (pdfBase64 && pdfBase64.length * 0.75 > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'Attachment too large' }, { status: 413 });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Invoice ${invoice.invoiceNumber} from LA FRUTA`,
        html: buildHtml(invoice, message),
        attachments: pdfBase64
          ? [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBase64 }]
          : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Resend says *why* it refused — unverified sender domain, bad key, test-mode
      // recipient limits. Passing that through is what makes the failure fixable.
      console.error('Resend rejected the send:', data);
      return NextResponse.json(
        { error: data?.message ?? 'The email provider rejected the request' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, id: data.id, to });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ error: 'Could not reach the email provider' }, { status: 502 });
  }
}
