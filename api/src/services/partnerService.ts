import { prisma } from "../models/index.ts";

export type CreatePartnerInput = {
  name: string;
  vatNumber: string;
  isoCode: string;
  companyId: string;
  deptCode?: string | null;
};

export type UpdatePartnerInput = Partial<{
  name: string;
  vatNumber: string;
  isoCode: string;
  deptCode: string | null;
}>;

async function ensureCountryExists(isoCode: string) {
  const code = isoCode.trim().toUpperCase();
  await prisma.country.upsert({
    where: { code },
    update: {},
    create: { code, name: code },
  });
  return code;
}

export async function listPartners(args: { companyId?: string; q?: string }) {
  const q = args.q?.trim();

  return prisma.partner.findMany({
    where: {
      ...(args.companyId ? { companies: { some: { companyId: args.companyId } } } : {}),
      ...(q
        ? {
            OR: [
              { vatNumber: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ name: "asc" }],
    take: 50,
  });
}

export async function getPartnerById(partnerId: string) {
  return prisma.partner.findUnique({ where: { id: partnerId } });
}

export async function createPartner(input: CreatePartnerInput) {
  const isoCode = await ensureCountryExists(input.isoCode);

  // Trouve ou crée le partenaire global (annuaire unique par vatNumber)
  const partner = await prisma.partner.upsert({
    where: { vatNumber: input.vatNumber },
    update: { name: input.name, isoCode, deptCode: input.deptCode ?? null },
    create: {
      name: input.name,
      vatNumber: input.vatNumber,
      isoCode,
      deptCode: input.deptCode ?? null,
    },
  });

  // Crée l'association société ↔ partenaire si elle n'existe pas
  await prisma.companyPartner.upsert({
    where: { companyId_partnerId: { companyId: input.companyId, partnerId: partner.id } },
    update: {},
    create: { companyId: input.companyId, partnerId: partner.id },
  });

  return partner;
}

export async function updatePartner(partnerId: string, input: UpdatePartnerInput) {
  return prisma.partner.update({
    where: { id: partnerId },
    data: input,
  });
}

export async function deletePartner(partnerId: string, companyId: string) {
  // Supprime uniquement l'association société ↔ partenaire, pas le partenaire global
  return prisma.companyPartner.delete({
    where: { companyId_partnerId: { companyId, partnerId } },
  });
}
