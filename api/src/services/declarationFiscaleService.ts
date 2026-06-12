import { prisma } from "../models/index.ts";
import { findOrCreateDeclaration } from "./declarationService.ts";
import type { Flow } from "../../prisma/generated/client/index.js";
import { Prisma } from "../models/index.ts";

export type CreateDeclarationFiscaleInput = {
  companyId: string;
  month: number;
  year: number;
  invoiceNumber: string;
  invoiceDate?: string | null;
  regime: string;
  value: number;
  partnerId: string;
}

export async function createDeclarationFiscale(input: CreateDeclarationFiscaleInput) {
  const declaration = await findOrCreateDeclaration({
    companyId: input.companyId,
    month: input.month,
    year: input.year,
    flow: "FISCALE" as Flow,
  });

  try {
    return await prisma.declarationFiscale.create({
      data: {
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null,
        regime: input.regime,
        value: input.value,
        partnerId: input.partnerId,
        declarationId: declaration.id,
      },
      include: {
        partner: true,
        declaration: true,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw Object.assign(
        new Error("Cette déclaration fiscale existe déjà pour ce partenaire sur cette période."),
        { code: "DUPLICATE_FISCAL" }
      );
    }
    throw error;
  }
}

export async function listDeclarationsFiscales(args: {
  companyId: string;
  month?: number;
  year?: number;
}) {
  return prisma.declarationFiscale.findMany({
    where: {
      declaration: {
        companyId: args.companyId,
        flow: "FISCALE" as Flow,
        ...(args.month ? { month: args.month } : {}),
        ...(args.year ? { year: args.year } : {}),
      },
    },
    include: {
      partner: { select: { id: true, name: true, vatNumber: true, isoCode: true } },
      declaration: { select: { id: true, flow: true, month: true, year: true, status: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });
}

export async function getDeclarationFiscaleById(id: string) {
  return prisma.declarationFiscale.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, name: true, vatNumber: true, isoCode: true } },
      declaration: { select: { id: true, flow: true, month: true, year: true, status: true } },
    },
  });
}

export async function updateDeclarationFiscale(
  id: string,
  input: Partial<Pick<CreateDeclarationFiscaleInput, 'invoiceNumber' | 'invoiceDate' | 'regime' | 'value' | 'partnerId'>>
) {
  return prisma.declarationFiscale.update({
    where: { id },
    data: {
      ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
      ...(input.invoiceDate !== undefined
        ? { invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null }
        : {}),
      ...(input.regime !== undefined ? { regime: input.regime } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.partnerId !== undefined ? { partnerId: input.partnerId } : {}),
    },
    include: {
      partner: { select: { id: true, name: true, vatNumber: true, isoCode: true } },
      declaration: { select: { id: true, flow: true, month: true, year: true, status: true } },
    },
  });
}

export async function deleteDeclarationFiscale(id: string) {
  return prisma.declarationFiscale.delete({ where: { id } });
}