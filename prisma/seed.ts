import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create dev user
  const hashedPassword = await bcrypt.hash('dev123456', 10);
  await prisma.user.upsert({
    where: { email: 'dev@local.com' },
    update: {},
    create: {
      email: 'dev@local.com',
      hashedPassword,
    },
  });

  // Sample entities
  const entities = [
    {
      name: 'Acme Corp',
      type: 'client',
      address: '270 Park Ave, New York, NY 10017',
      email: 'billing@acme.com',
      abaRouting: '021000021',
      accountNumber: '1234567890',
      bankName: 'Chase Bank',
      bankAddress: '270 Park Ave, New York, NY 10017',
      primaryColor: '#1D4ED8',
      invoicePrefix: 'ACME',
    },
    {
      name: 'My Consulting LLC',
      type: 'provider',
      address: '100 N Tryon St, Charlotte, NC 28255',
      email: 'info@myconsulting.com',
      abaRouting: '021000089',
      accountNumber: '9876543210',
      bankName: 'Bank of America',
      bankAddress: '100 N Tryon St, Charlotte, NC 28255',
      primaryColor: '#059669',
      invoicePrefix: 'MYCO',
    },
    {
      name: 'Global Services Inc',
      type: 'both',
      address: '420 Montgomery St, San Francisco, CA 94104',
      email: 'billing@globalservices.com',
      abaRouting: '026009593',
      accountNumber: '5555444433',
      bankName: 'Wells Fargo',
      bankAddress: '420 Montgomery St, San Francisco, CA 94104',
      primaryColor: '#7C3AED',
      invoicePrefix: 'GLOB',
    },
  ];

  for (const entity of entities) {
    await prisma.entity.upsert({
      where: { invoicePrefix: entity.invoicePrefix },
      update: {},
      create: entity,
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
