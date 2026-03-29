import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('w#Ah2OF5^!!salpb', 10);
  await prisma.user.upsert({
    where: { email: 'jose.matias.rivero@gmail.com' },
    update: {},
    create: {
      email: 'jose.matias.rivero@gmail.com',
      hashedPassword,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
