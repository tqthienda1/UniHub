import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating users...');
  
  const instructorResult = await (prisma.user as any).updateMany({
    where: {
      role: 'INSTRUCTOR',
    },
    data: {
      role: 'CHECKIN_STAFF',
    },
  });
  console.log(`Updated ${instructorResult.count} INSTRUCTOR users to CHECKIN_STAFF`);

  const staffResult = await (prisma.user as any).updateMany({
    where: {
      role: 'STAFF',
    },
    data: {
      role: 'CHECKIN_STAFF',
    },
  });
  console.log(`Updated ${staffResult.count} STAFF users to CHECKIN_STAFF`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
