import dotenv from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { normalizePostgresSslMode } from "./src/connection-url.cjs";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: normalizePostgresSslMode(env("DATABASE_URL")),
  },
});
