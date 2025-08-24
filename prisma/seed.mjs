import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'ykto@taylormode.co.jp';
  const plain = 'Root123!3030';
  const hashed = await bcrypt.hash(plain, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, hashedPassword: hashed },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


