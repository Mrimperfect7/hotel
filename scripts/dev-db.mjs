#!/usr/bin/env node
/**
 * Zero-Docker embedded PostgreSQL for local development.
 *
 * Downloads a portable PostgreSQL 16 binaries zip (~60 MB, one time) into
 * scripts/.pgsql, then runs `initdb` + `pg_ctl` directly against .pgdata/.
 * This keeps local dev identical to production Postgres (real SQL, real
 * row-level locking) without requiring Docker Desktop.
 *
 * Commands: up | down | status | reset
 */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(__dirname, '.pgsql');
const DATA_DIR = path.join(ROOT, '.pgdata');
const PORT = 5433;
const VERSION = '16.4-1';
const USER = 'gsv';
const PASSWORD = 'gsv';
const DB = 'guruvayoor_stay';

const ENTERPRISES = 'https://get.enterprisedb.com/postgresql';

function pgBin(name) {
  const p = path.join(BIN_DIR, 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`);
  if (!fs.existsSync(p)) throw new Error(`pg binary missing: ${p} — run "npm run dev:db" once to download.`);
  return p;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.rmSync(dest, { force: true });
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) { file.close(); return reject(new Error(`HTTP ${res.statusCode} for ${url}`)); }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function ensureBinaries() {
  if (fs.existsSync(path.join(BIN_DIR, 'bin'))) return;
  if (process.platform !== 'win32') {
    console.error('dev-db.mjs auto-download supports Windows only here.');
    console.error('On macOS/Linux use docker-compose.yml or a system Postgres on :5433.');
    process.exit(1);
  }
  const zipName = `postgresql-${VERSION}-windows-x64-binaries.zip`;
  const zipPath = path.join(__dirname, zipName);
  fs.mkdirSync(BIN_DIR, { recursive: true });
  console.log(`Downloading portable PostgreSQL ${VERSION} (one-time, ~350 MB)…`);
  await download(`${ENTERPRISES}/${zipName}`, zipPath);
  console.log('Extracting…');
  // Windows: use PowerShell Expand-Archive via spawn (no external deps).
  execFileSync('powershell', ['-NoProfile', '-Command',
    `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${BIN_DIR}' -Force`],
    { stdio: 'inherit' });
  fs.rmSync(zipPath, { force: true });
  // Binaries extract to postgresql-16.4-1/bin — flatten.
  const entries = fs.readdirSync(BIN_DIR);
  const inner = entries.find((e) => e.startsWith('postgresql') && fs.statSync(path.join(BIN_DIR, e)).isDirectory());
  if (inner) {
    for (const f of fs.readdirSync(path.join(BIN_DIR, inner))) {
      fs.renameSync(path.join(BIN_DIR, inner, f), path.join(BIN_DIR, f));
    }
    fs.rmSync(path.join(BIN_DIR, inner), { recursive: true, force: true });
  }
  console.log('PostgreSQL ready.');
}

function run(bin, args, opts = {}) {
  return execFileSync(pgBin(bin), args, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

function isRunning() {
  try {
    run('pg_isready', ['-h', '127.0.0.1', '-p', String(PORT), '-U', USER], { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

async function up() {
  await ensureBinaries();
  if (isRunning()) { console.log(`Postgres already running on :${PORT}`); return; }
  if (!fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'))) {
    console.log('Initializing data directory…');
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    run('initdb', ['-D', DATA_DIR, '-U', USER, '-A', 'trust', '-E', 'UTF8']);
  }
  console.log('Starting PostgreSQL…');
  const child = spawn(pgBin('pg_ctl'), ['-D', DATA_DIR, '-o', `-p ${PORT} -h 127.0.0.1`, '-l', path.join(DATA_DIR, 'server.log'), 'start'],
    { stdio: 'ignore', detached: process.platform !== 'win32' });
  child.unref?.();
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (isRunning()) {
      // Ensure role password + database exist (idempotent).
      try {
        run('psql', ['-h', '127.0.0.1', '-p', String(PORT), '-U', USER, '-d', 'postgres',
          '-c', `ALTER USER ${USER} WITH PASSWORD '${PASSWORD}';`,
          '-c', `SELECT 'ok' FROM pg_database WHERE datname='${DB}'`], { stdio: 'pipe' });
      } catch { /* database may already exist or alter fails harmlessly */ }
      try {
        run('createdb', ['-h', '127.0.0.1', '-p', String(PORT), '-U', USER, DB]);
        console.log(`Database "${DB}" created.`);
      } catch { /* exists */ }
      console.log(`✅ PostgreSQL ready: postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB}`);
      return;
    }
  }
  throw new Error('Postgres did not become ready in time. Check .pgdata/server.log');
}

function down() {
  try {
    run('pg_ctl', ['-D', DATA_DIR, 'stop', '-m', 'fast']);
    console.log('PostgreSQL stopped.');
  } catch { console.log('PostgreSQL not running.'); }
}

function status() {
  console.log(isRunning() ? `running on :${PORT}` : 'stopped');
}

function reset() {
  down();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  console.log('Data directory wiped.');
}

const [cmd] = process.argv.slice(2);
const commands = { up, down, status, reset };
if (!commands[cmd]) {
  console.error('Usage: node scripts/dev-db.mjs <up|down|status|reset>');
  process.exit(1);
}
commands[cmd]();
