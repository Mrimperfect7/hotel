/**
 * Guruvayoor Stay — environment configuration loader.
 * Reads .env from the repo root (two levels up) so both apps/api and apps/web
 * can share one file. Falls back to process.env when already provided.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// packages/config/dist/index.js → ../../.. = repo root
const ROOT = path.resolve(__dirname, '..', '..', '..');

type EnvShape = Record<string, string | undefined>;

function parseEnvFile(text: string): EnvShape {
  const out: EnvShape = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

let fileEnv: EnvShape = {};
try {
  fileEnv = parseEnvFile(fs.readFileSync(path.join(ROOT, '.env'), 'utf8'));
} catch {
  // .env optional — process.env wins when present.
}

/** Read an env var: process.env first, then .env file. */
export function env(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fileEnv[key] ?? fallback;
}

/** Read with no fallback — throws when missing at boot. */
export function envRequired(key: string): string {
  const v = env(key);
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

/** Parse an int env var with fallback. */
export function envInt(key: string, fallback: number): number {
  const v = Number(env(key, String(fallback)));
  return Number.isFinite(v) ? v : fallback;
}

export const config = (() => {
  // Side-effect: expose parsed .env values as real process.env entries so that
  // consumers reading process.env directly (Prisma, Next.js server code, JWT lib)
  // see the same configuration as `config.*` readers. process.env wins.
  for (const [k, v] of Object.entries(fileEnv)) {
    if (process.env[k] === undefined && v !== undefined) process.env[k] = v;
  }
  return {
  nodeEnv: env('NODE_ENV', 'development'),
  isProd: env('NODE_ENV') === 'production',
  port: envInt('PORT', 4000),
  webOrigin: env('WEB_ORIGIN', 'http://localhost:3000')!,
  apiOrigin: env('API_ORIGIN', 'http://localhost:4000')!,
  databaseUrl: env('DATABASE_URL'),
  jwtSecret: env('JWT_SECRET', 'dev-only-jwt-secret-change-me')!,
  refreshSecret: env('REFRESH_TOKEN_SECRET', 'dev-only-refresh-secret-change-me')!,
  jwtAccessTtl: env('JWT_ACCESS_TTL', '15m')!,
  refreshTtlDays: envInt('JWT_REFRESH_TTL_DAYS', 30),
  temple: {
    lat: Number(env('TEMPLE_LAT', '10.5945')),
    lng: Number(env('TEMPLE_LNG', '76.2075')),
  },
  razorpay: {
    keyId: env('RAZORPAY_KEY_ID', ''),
    keySecret: env('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: env('RAZORPAY_WEBHOOK_SECRET', ''),
  },
  paymentMock: env('PAYMENT_MOCK', '') !== '0',
  logLevel: env('LOG_LEVEL', 'info')!,
  emailProvider: env('EMAIL_PROVIDER', 'console')!,
  smsProvider: env('SMS_PROVIDER', 'console')!,
  whatsappProvider: env('WHATSAPP_PROVIDER', 'console')!,
  } as const;
})();
