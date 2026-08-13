import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "./generated";
import { normalizePostgresSslMode } from "./connection-url.cjs";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
  quiet: true,
});

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString: normalizePostgresSslMode(connectionString),
});

export const prisma = new PrismaClient({
  adapter,
});

export default prisma;
