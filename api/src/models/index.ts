import { PrismaClient } from "../../prisma/generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "../../prisma/generated/client/index.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });