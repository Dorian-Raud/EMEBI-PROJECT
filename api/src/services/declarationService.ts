import { prisma } from "../models/index.ts";
import type { Flow } from "../../prisma/generated/client/index.js";

export async function findOrCreateDeclaration(input: {
  companyId: string;
  month: number;
  year: number;
  flow: Flow;
}) {
  const existing = await prisma.declaration.findFirst({
    where: {
      companyId: input.companyId,
      month: input.month,
      year: input.year,
      flow: input.flow,
    },
  });
  if (existing) return existing;

  return prisma.declaration.create({
    data: {
      companyId: input.companyId,
      month: input.month,
      year: input.year,
      flow: input.flow,
    },
  });
}
