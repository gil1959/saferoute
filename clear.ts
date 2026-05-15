import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.incident.deleteMany({});
  console.log("All old incidents deleted.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
