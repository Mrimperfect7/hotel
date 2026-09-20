import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🚀 [Vercel Build] Starting Namma Guruvayoor build pipeline...');

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Generate Prisma Client
try {
  run('npm run db:generate -w @gsv/database');
} catch (e) {
  if (process.platform === 'win32' && fs.existsSync(path.join(ROOT, 'node_modules', '@prisma', 'client', 'index.d.ts'))) {
    console.warn('⚠️ [Windows file lock]: Prisma client already exists, proceeding with build.');
  } else {
    throw e;
  }
}

// 2. Build dependent packages (@gsv/config, @gsv/types, @gsv/database)
run('npm run build:packages');

// 3. Build API (@gsv/api)
run('npm run build -w @gsv/api');

// 4. Ensure root dist directory exists to satisfy Vercel outputDirectory checks
const rootDist = path.join(ROOT, 'dist');
const apiDist = path.join(ROOT, 'apps', 'api', 'dist');

if (!fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
}

// Copy compiled API assets into root dist
if (fs.existsSync(apiDist)) {
  fs.cpSync(apiDist, rootDist, { recursive: true });
  console.log('✅ Copied apps/api/dist to root dist/');
}

// Ensure an index.html exists in dist
fs.writeFileSync(
  path.join(rootDist, 'index.html'),
  '<!doctype html><html><head><title>Namma Guruvayoor API</title></head><body><h1>Namma Guruvayoor API is Running</h1></body></html>'
);

console.log('\n🎉 [Vercel Build] Completed successfully!');
