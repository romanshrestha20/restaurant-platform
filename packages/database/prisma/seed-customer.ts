import prisma from "../src/client";
import { seedCustomer } from "./seed/customer";

async function main() {
  const customerRole = await prisma.role.findUnique({
    where: { name: "CUSTOMER" },
    select: { id: true },
  });

  if (!customerRole) {
    throw new Error(
      "CUSTOMER role is not configured. Run the standard database seed first.",
    );
  }

  const customer = await seedCustomer(prisma, customerRole.id);
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
