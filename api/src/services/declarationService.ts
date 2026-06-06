import { prisma } from "../models/index.ts";
import type { Flow } from "../../prisma/generated/client/index.js";

export async function findOrCreateDeclaration(input: {
  companyId: string;
  month: number;
  year: number;
  flow: Flow;
}) {
  return prisma.declaration.upsert({
    where: {
      companyId_month_year_flow: {  // ← nom de la contrainte unique composite
        companyId: input.companyId,
        month: input.month,
        year: input.year,
        flow: input.flow,
      },
    },
    update: {},
    create: {
      companyId: input.companyId,
      month: input.month,
      year: input.year,
      flow: input.flow,
    },
  });
}
