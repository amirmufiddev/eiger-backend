import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function seed() {
  const client = postgres(connectionString as string);
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // Create admin user
  const [admin] = await db
    .insert(schema.users)
    .values({ email: 'admin@eiger.com', name: 'Admin', role: 'admin' })
    .returning();

  // Create member user
  const [member] = await db
    .insert(schema.users)
    .values({ email: 'member@eiger.com', name: 'Test Member', role: 'member' })
    .returning();

  // Create wallets
  await db.insert(schema.wallets).values([
    { userId: admin.id, balance: '1000000' },
    { userId: member.id, balance: '500000' },
  ]);

  // Create memberships
  await db.insert(schema.memberships).values([
    { userId: admin.id, tier: 'gold', points: 10000 },
    { userId: member.id, tier: 'silver', points: 500 },
  ]);

  // Create products
  await db.insert(schema.products).values([
    {
      name: 'Base Entrance Pass',
      description: 'Tiket wajib masuk kawasan EAL',
      price: '50000',
      costPrice: '10000',
      operationalCost: '5000',
    },
    {
      name: 'Suspension Bridge',
      description: 'Wahana suspension bridge',
      price: '75000',
      costPrice: '15000',
      operationalCost: '8000',
    },
    {
      name: 'Cable Car',
      description: 'Wahana cable car',
      price: '100000',
      costPrice: '20000',
      operationalCost: '10000',
    },
    {
      name: 'All-Access Pass',
      description: 'Tiket terusan + wahana premium',
      price: '200000',
      costPrice: '40000',
      operationalCost: '15000',
    },
  ]);

  // Create payment methods
  await db.insert(schema.paymentMethods).values([
    { code: 'EWALLET', name: 'E-Wallet EAL' },
    { code: 'VA', name: 'Virtual Account' },
    { code: 'QRIS', name: 'QRIS' },
    { code: 'CC', name: 'Kartu Kredit' },
  ]);

  console.log('Seed completed!');
  console.log('Admin:', admin.email);
  console.log('Member:', member.email);

  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
