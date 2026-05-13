const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.length);
  const admin = users.find(u => u.role === 'ADMIN');
  console.log('Admin:', admin ? admin.email : 'None');
  
  const workshops = await prisma.workshop.findMany();
  console.log('Workshops:', workshops.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
