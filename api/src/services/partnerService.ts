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

export async function listPartners(args: { companyId?: string; q?: string }) {
  const q = args.q?.trim();

  return prisma.partner.findMany({
    where: {
      ...(args.companyId ? { companyId: args.companyId } : {}),
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

async function ensureCountryExists(isoCode: string) {
  const code = isoCode.trim().toUpperCase();
  await prisma.country.upsert({
    where: { code },
    update: {},
    create: { code, name: code },
  });
  return code;
}

export async function createPartner(input: CreatePartnerInput) {
  const isoCode = await ensureCountryExists(input.isoCode);

  return prisma.partner.create({
    data: {
      name: input.name,
      vatNumber: input.vatNumber,
      isoCode,
      deptCode: input.deptCode ?? null,
      companyId: input.companyId,
    },
  });
}

export async function updatePartner(partnerId: string, input: UpdatePartnerInput) {
  return prisma.partner.update({
    where: { id: partnerId },
    data: input,
  });
}

export async function deletePartner(partnerId: string) {
  return prisma.partner.delete({ where: { id: partnerId } });
}

