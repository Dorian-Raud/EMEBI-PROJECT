import { prisma } from "../models/index.ts";

export const listCompanies = async () => prisma.company.findMany();

export const getCompanyById = async (id: string) =>
  prisma.company.findUnique({ where: { id } });

export const createCompany = async (data: { name: string; siret: string; vatNumber: string }) => {
  return prisma.company.create({
    data: {
      name: data.name,
      siret: data.siret,
      vatNumber: data.vatNumber,
    },
  });
};