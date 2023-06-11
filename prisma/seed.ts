import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roundsOfHashing = Number(process.env.ROUNDS_OF_HASHING ?? 10);
  const adminPassword = await bcrypt.hash('adminpwd', roundsOfHashing);
  const userPassword = await bcrypt.hash('userpwd', roundsOfHashing);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      name: 'Admin',
      role: Role.ADMIN,
      password: adminPassword,
    },
  });
  const user = await prisma.user.upsert({
    where: { email: 'user@user.com' },
    update: {},
    create: {
      email: 'user@user.com',
      name: 'User',
      role: Role.USER,
      password: userPassword,
    },
  });
  console.log({ admin, user });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
