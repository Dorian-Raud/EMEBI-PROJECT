import { prisma } from "../config/prisma.ts";

export const createCompany = async (data: { name: string; siret: string; vatNumber: string }) => {
  
  return await prisma.company.create({
    data: {
      name: data.name,
      siret: data.siret,
      vatNumber: data.vatNumber,
    },
  });
};