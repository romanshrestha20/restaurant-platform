import prisma from "../src/client";
import { seedCustomer } from "./seed/customer";

async function main() {
  const customer = await seedCustomer(prisma);
  console.log(`Customer seed completed for ${customer.email}.`);
}

main()
  .catch((error) => {
    console.error("Customer seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
