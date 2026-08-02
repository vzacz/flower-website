import { NextRequest, NextResponse } from 'next/server';
import { dumpAllTables } from '@/lib/db';

// This route reads live data and emails it, so it must never be cached or
// prerendered — always run fresh at request time.
export const dynamic = 'force-dynamic';

/**
 * Scheduled off-site backup.
 *
 * Vercel Cron (see vercel.json) calls this once a day. It reads every table and
 * emails the whole thing as a dated JSON attachment, so a copy of the business
 * always lives somewhere other than Supabase — even if the project were paused
 * or deleted, the backups sit in the owner's inbox.
 *
 * Trigger manually to test:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://lafrutasj.com/api/backup
 * Add ?dry=1 to build the backup and report row counts WITHOUT sending an email.
 */

// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when the
// CRON_SECRET env var is set. We refuse to run without it, so a paused-but-live
// deploy can't leak the whole database to an anonymous GET.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function stamp(iso: string): string {
  // 2026-08-02T09:00:00.000Z -> 2026-08-02-0900
  return iso.slice(0, 16).replace('T', '-').replace(':', '');
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let backup;
  try {
    backup = await dumpAllTables();
  } catch (error) {
    console.error('Backup failed while reading the database:', error);
    const reason = error instanceof Error ? error.message : 'Could not read the database.';
    return NextResponse.json({ error: reason }, { status: 500 });
  }

  const counts = Object.fromEntries(
    Object.entries(backup.tables).map(([table, rows]) => [table, rows.length])
  );

  // A dry run confirms the backup builds and the counts look right without
  // putting an email in anyone's inbox — used to verify the wiring.
  if (request.nextUrl.searchParams.get('dry') === '1') {
    return NextResponse.json({ ok: true, dryRun: true, takenAt: backup.takenAt, counts });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  // Falls back to the sender so a backup still lands somewhere the owner controls
  // if BACKUP_TO_EMAIL was never set.
  const to = process.env.BACKUP_TO_EMAIL || from;

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      {
        error:
          'Backup email is not configured. Set RESEND_API_KEY, INVOICE_FROM_EMAIL, and BACKUP_TO_EMAIL.',
      },
      { status: 503 }
    );
  }

  const filename = `la-fruta-backup-${stamp(backup.takenAt)}.json`;
  const json = JSON.stringify(backup, null, 2);
  const summary = Object.entries(counts)
    .map(([table, n]) => `${table}: ${n}`)
    .join(' · ');

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
        subject: `LA FRUTA backup — ${stamp(backup.takenAt)}`,
        text:
          `Automatic backup of the LA FRUTA database.\n\n` +
          `Taken: ${backup.takenAt}\n${summary}\n\n` +
          `The full backup is attached as ${filename}. Keep it — this is your off-site copy.`,
        attachments: [{ filename, content: Buffer.from(json).toString('base64') }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backup email rejected by Resend:', data);
      const reason = data?.message ?? 'The email provider rejected the backup.';
      return NextResponse.json({ error: reason }, { status: response.status });
    }

    return NextResponse.json({ ok: true, sentTo: to, takenAt: backup.takenAt, counts, id: data.id });
  } catch (error) {
    console.error('Could not send the backup email:', error);
    return NextResponse.json({ error: 'Could not reach the email provider.' }, { status: 502 });
  }
}
