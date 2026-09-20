/**
 * Gupshup WhatsApp adapter.
 * Docs: https://docs.gupshup.io/docs/send-message
 *
 * Reads from env:
 *   WHATSAPP_API_KEY        — Gupshup API key
 *   WHATSAPP_FROM_NUMBER    — Platform's registered Gupshup sender number (e.g. 918XXXXXXXXX)
 *   WHATSAPP_APP_NAME       — Gupshup App name (created in their dashboard)
 */
import { env } from '@gsv/config';

const GUPSHUP_API = 'https://api.gupshup.io/wa/api/v1/msg';

function e164(phone: string): string {
  // Strip non-digits, ensure Indian numbers start with 91
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function sendGupshupWhatsApp(
  toPhone: string,
  message: string,
): Promise<void> {
  const apiKey = env('WHATSAPP_API_KEY');
  const fromNumber = env('WHATSAPP_FROM_NUMBER');
  const appName = env('WHATSAPP_APP_NAME', 'NammaGuruvayoor');

  if (!apiKey || !fromNumber) {
    // eslint-disable-next-line no-console
    console.warn('[WHATSAPP/gupshup] Missing WHATSAPP_API_KEY or WHATSAPP_FROM_NUMBER — skipping send.');
    return;
  }

  const to = e164(toPhone);

  const body = new URLSearchParams({
    channel: 'whatsapp',
    source: fromNumber,
    destination: to,
    'src.name': appName ?? 'NammaGuruvayoor',
    message: JSON.stringify({ type: 'text', text: message }),
  });

  const res = await fetch(GUPSHUP_API, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gupshup WhatsApp error ${res.status}: ${text}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[WHATSAPP/gupshup → ${to}] sent`);
}
