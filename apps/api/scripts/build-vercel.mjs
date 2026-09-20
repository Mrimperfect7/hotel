import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Find repository root dynamically (package.json with workspaces)
let currentDir = path.dirname(fileURLToPath(import.meta.url));
let ROOT = currentDir;
while (ROOT !== path.dirname(ROOT)) {
  const pkgPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.workspaces) break;
    } catch {}
  }
  ROOT = path.dirname(ROOT);
}

console.log(`🚀 [Vercel Build] Repository root: ${ROOT}`);
console.log(`🚀 [Vercel Build] Working directory: ${process.cwd()}`);

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

// 4. Ensure dist exists in ROOT, apps/api, and current working directory
const rootDist = path.join(ROOT, 'dist');
const apiDist = path.join(ROOT, 'apps', 'api', 'dist');
const cwdDist = path.join(process.cwd(), 'dist');

for (const dir of [rootDist, apiDist, cwdDist]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const htmlFallback = '<!doctype html><html><head><title>Namma Guruvayoor API</title></head><body><h1>Namma Guruvayoor API is Running</h1></body></html>';
fs.writeFileSync(path.join(rootDist, 'index.html'), htmlFallback);
fs.writeFileSync(path.join(apiDist, 'index.html'), htmlFallback);
fs.writeFileSync(path.join(cwdDist, 'index.html'), htmlFallback);

// Sync compiled API files into all possible dist locations
if (fs.existsSync(apiDist)) {
  if (rootDist !== apiDist) fs.cpSync(apiDist, rootDist, { recursive: true });
  if (cwdDist !== apiDist) fs.cpSync(apiDist, cwdDist, { recursive: true });
}

console.log(`✅ [Vercel Build] Synced output directories.`);
console.log('\n🎉 [Vercel Build] Completed successfully!');
