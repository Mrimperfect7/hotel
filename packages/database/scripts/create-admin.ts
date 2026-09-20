/**
 * Create or promote an admin user — PRODUCTION-SAFE.
 * Credentials come from env/args only; never hard-coded.
 *
 *   npm run admin:create -w @gsv/database
 *   (reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME or DEMO_ADMIN_*)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? process.env.DEMO_ADMIN_EMAIL ?? '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? process.env.DEMO_ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME ?? process.env.DEMO_ADMIN_NAME ?? 'Platform Admin';

  if (!email || !password) {
    console.error('✖ Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) and re-run.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('✖ Admin password must be at least 12 characters.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12), isBlocked: false },
    });
    console.log(`✔ Promoted/updated SUPER_ADMIN: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        role: 'SUPER_ADMIN',
        passwordHash: await bcrypt.hash(password, 12),
        emailVerified: true,
      },
    });
    console.log(`✔ Created SUPER_ADMIN: ${email}`);
  }
}

main().finally(() => prisma.$disconnect());
