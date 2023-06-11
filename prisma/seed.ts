import { Account_Type, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roundsOfHashing = Number(process.env.ROUNDS_OF_HASHING ?? 10);
  const adminPassword = await bcrypt.hash('adminpwd', roundsOfHashing);
  const userPassword = await bcrypt.hash('userpwd', roundsOfHashing);

  const itau = await prisma.bank.upsert({
    where: { name: 'Banco Itau' },
    update: {},
    create: {
      name: 'Banco Itau',
      phone: '123-456-7890',
      address: 'Zabala 1463, 11000 Montevideo, Departamento de Montevideo',
    },
  });

  const santander = await prisma.bank.upsert({
    where: { name: 'Banco Santander' },
    update: {},
    create: {
      name: 'Banco Santander',
      phone: '123-456-7890',
      address:
        'treinta y 11000, Treinta y Tres 1334, 11000 Montevideo, Departamento de Montevideo',
    },
  });

  const scotia = await prisma.bank.upsert({
    where: { name: 'Scotiabank' },
    update: {},
    create: {
      name: 'Scotiabank',
      phone: '123-456-7890',
      address: 'Misiones 1399, 11000 Montevideo, Departamento de Montevideo',
    },
  });

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
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@user.com' },
    update: {},
    create: {
      email: 'user2@user.com',
      name: 'Second User',
      role: Role.USER,
      password: userPassword,
    },
  });

  const user_itau = await prisma.account.create({
    data: {
      account_type: Account_Type.BASIC_SAVINGS,
      balance: 1000,
      bankId: itau.id,
      userId: user.id,
    },
  });

  const user_itau_savings = await prisma.account.create({
    data: {
      account_type: Account_Type.SAVINGS,
      balance: 5000,
      bankId: itau.id,
      userId: user.id,
    },
  });

  const user_itau_current = await prisma.account.create({
    data: {
      account_type: Account_Type.CURRENT,
      balance: 50000,
      bankId: itau.id,
      userId: user.id,
    },
  });
  const user2_santander = await prisma.account.create({
    data: {
      account_type: Account_Type.BASIC_SAVINGS,
      balance: 1000,
      bankId: santander.id,
      userId: user2.id,
    },
  });

  const user2_scotia_savings = await prisma.account.create({
    data: {
      account_type: Account_Type.SAVINGS,
      balance: 5000,
      bankId: scotia.id,
      userId: user2.id,
    },
  });

  const admin_itau_current = await prisma.account.create({
    data: {
      account_type: Account_Type.CURRENT,
      balance: 50000,
      bankId: itau.id,
      userId: admin.id,
    },
  });
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
