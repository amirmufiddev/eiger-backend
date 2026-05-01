import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as crypto from 'crypto';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  const adminPassword = hashPassword('admin123');
  const memberPassword = hashPassword('member123');

  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: 'admin@eiger.com',
      name: 'Admin User',
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning();

  const [memberUser] = await db
    .insert(schema.users)
    .values({
      email: 'member@eiger.com',
      name: 'Member User',
      role: 'member',
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    await db.insert(schema.accounts).values({
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: 'credential',
      password: adminPassword,
    });
    console.log('Admin user created: admin@eiger.com / admin123');
  }

  if (memberUser) {
    await db.insert(schema.accounts).values({
      userId: memberUser.id,
      accountId: memberUser.id,
      providerId: 'credential',
      password: memberPassword,
    });

    await db.insert(schema.wallets).values({
      userId: memberUser.id,
      balance: '100000',
    });

    await db.insert(schema.memberships).values({
      userId: memberUser.id,
      tier: 'bronze',
      points: 0,
    });
    console.log('Member user created: member@eiger.com / member123');
  }

  const productsData = [
    {
      name: 'Base Entrance Pass',
      description: 'Tiket wajib masuk kawasan EAL',
      price: '50000',
      costPrice: '10000',
      operationalCost: '5000',
    },
    {
      name: 'Suspension Bridge',
      description: 'Tiket wahana Suspension Bridge',
      price: '75000',
      costPrice: '15000',
      operationalCost: '5000',
    },
    {
      name: 'Cable Car',
      description: 'Tiket wahana Cable Car',
      price: '100000',
      costPrice: '20000',
      operationalCost: '10000',
    },
    {
      name: 'All-Access Bundle',
      description: 'Tiket terusan masuk + seluruh wahana premium',
      price: '200000',
      costPrice: '40000',
      operationalCost: '15000',
    },
  ];

  for (const product of productsData) {
    await db.insert(schema.products).values(product).onConflictDoNothing();
  }
  console.log('Products seeded');

  const paymentMethodsData = [
    { code: 'EWALLET', name: 'E-Wallet EAL' },
    { code: 'VA', name: 'Virtual Account' },
    { code: 'QRIS', name: 'QRIS' },
    { code: 'CC', name: 'Kartu Kredit' },
  ];

  for (const pm of paymentMethodsData) {
    await db.insert(schema.paymentMethods).values(pm).onConflictDoNothing();
  }
  console.log('Payment methods seeded');

  console.log('Seeding completed!');
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
