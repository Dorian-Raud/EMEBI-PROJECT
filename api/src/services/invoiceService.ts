import { prisma, Prisma } from "../models/index.ts";
import { findOrCreateDeclaration } from "./declarationService.ts";
import type { Flow } from "../../prisma/generated/client/index.js";

export type InvoiceLineInput = {
  lineNumber: number;
  nomenclatureCode: string;
  mass: number;
  supplementaryUnit?: number | null;
  value: number;
  originCountryCode: string;
  provCountryCode: string;
};

export type CreateInvoiceInput = {
  companyId: string;
  flow: Flow;
  month: number;
  year: number;
  invoiceNumber: string;
  invoiceDate?: string | null;
  regime: string;
  transactionNature: string;
  transportMode?: string | null;
  partnerId: string;
  deptCode?: string;
  lines: InvoiceLineInput[];
};

export type UpdateInvoiceInput = Partial<{
  invoiceNumber: string;
  invoiceDate: string | null;
  regime: string;
  transactionNature: string;
  transportMode: string | null;
  partnerId: string;
  deptCode: string;
  lines: InvoiceLineInput[];
}>;

async function ensureDepartment(code: string) {
  const c = code.trim();
  const existing = await prisma.department.findUnique({ where: { code: c } });
  if (existing) return c;
  await prisma.department.create({
    data: { code: c, name: `Département ${c}` },
  });
  return c;
}

async function ensureCountry(code: string) {
  const c = code.trim().toUpperCase();
  await prisma.country.upsert({
    where: { code: c },
    update: {},
    create: { code: c, name: c },
  });
  return c;
}

async function ensureNomenclature(code: string, year = new Date().getFullYear()) {
  const existing = await prisma.nomenclature.findFirst({
    where: { code, year },
  });
  if (existing) return existing;

  return prisma.nomenclature.create({
    data: {
      code,
      year,
      label: `NC ${code}`,
    },
  });
}

export async function listInvoices(args: {
  companyId: string;
  q?: string;
  flow?: Flow;
  month?: number;
  year?: number;
}) {
  const q = args.q?.trim();

  return prisma.invoiceHeader.findMany({
    where: {
      declaration: {
        companyId: args.companyId,
        ...(args.flow ? { flow: args.flow } : {}),
        ...(args.month ? { month: args.month } : {}),
        ...(args.year ? { year: args.year } : {}),
      },
      ...(q
        ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { partner: { name: { contains: q, mode: "insensitive" } } },
            { partner: { vatNumber: { contains: q, mode: "insensitive" } } },
          ],
        }
        : {}),
    },
    include: {
      partner: { select: { id: true, name: true, vatNumber: true, isoCode: true } },
      declaration: { select: { id: true, flow: true, month: true, year: true, status: true } },
      lines: { select: { id: true, value: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getInvoiceById(invoiceId: string) {
  return prisma.invoiceHeader.findUnique({
    where: { id: invoiceId },
    include: {
      partner: true,
      declaration: true,
      lines: {
        include: { nomenclature: true, originCountry: true, provCountry: true },
        orderBy: { lineNumber: "asc" },
      },
    },
  });
}

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const declaration = await findOrCreateDeclaration({
      companyId: input.companyId,
      month: input.month,
      year: input.year,
      flow: input.flow,
    });

    const partner = await prisma.partner.findUnique({ where: { id: input.partnerId } });
    const headerDept = input.deptCode ?? partner?.deptCode ?? "75";
    await ensureDepartment(headerDept);

    const lineRows = [];
    for (const line of input.lines) {
      const [, , nomenclature] = await Promise.all([
        ensureCountry(line.originCountryCode),
        ensureCountry(line.provCountryCode),
        ensureNomenclature(line.nomenclatureCode, input.year),
      ]);
      lineRows.push({
        lineNumber: line.lineNumber,
        mass: line.mass,
        supplementaryUnit: line.supplementaryUnit ?? null,
        value: line.value,
        originCountryCode: line.originCountryCode.trim().toUpperCase(),
        provCountryCode: line.provCountryCode.trim().toUpperCase(),
        nomenclatureId: nomenclature.id,
      });
    }

    const result = await prisma.invoiceHeader.create({
      data: {
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null,
        regime: input.regime,
        transactionNature: input.transactionNature,
        transportMode: input.transportMode ?? null,
        deptCode: headerDept,
        partnerId: input.partnerId,
        declarationId: declaration.id,
        lines: { create: lineRows },
      },
      include: {
        partner: true,
        declaration: true,
        lines: { include: { nomenclature: true }, orderBy: { lineNumber: "asc" } },
      },
    });

    return result;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw Object.assign(
        new Error("Cette facture existe déjà pour ce fournisseur et sur cette période."),
        { code: "DUPLICATE_INVOICE" }
      );
    }
    throw error;
  }
}

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput) {
  if (input.lines) {
    await prisma.invoiceLine.deleteMany({ where: { headerId: invoiceId } });
    const header = await prisma.invoiceHeader.findUnique({
      where: { id: invoiceId },
      include: { declaration: true },
    });
    if (!header) throw Object.assign(new Error("Facture introuvable"), { code: "NOT_FOUND" });

    const declarationYear = header.declaration.year;
    const headerDept = input.deptCode ?? header.deptCode;
    await ensureDepartment(headerDept);
    for (const line of input.lines) {
      await ensureCountry(line.originCountryCode);
      await ensureCountry(line.provCountryCode);
      const nomenclature = await ensureNomenclature(
        line.nomenclatureCode,
        declarationYear,
      );
      await prisma.invoiceLine.create({
        data: {
          headerId: invoiceId,
          lineNumber: line.lineNumber,
          mass: line.mass,
          supplementaryUnit: line.supplementaryUnit ?? null,
          value: line.value,
          originCountryCode: line.originCountryCode.trim().toUpperCase(),
          provCountryCode: line.provCountryCode.trim().toUpperCase(),
          nomenclatureId: nomenclature.id,
        },
      });
    }
  }

  return prisma.invoiceHeader.update({
    where: { id: invoiceId },
    data: {
      ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
      ...(input.invoiceDate !== undefined
        ? { invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null }
        : {}),
      ...(input.regime !== undefined ? { regime: input.regime } : {}),
      ...(input.transactionNature !== undefined
        ? { transactionNature: input.transactionNature }
        : {}),
      ...(input.transportMode !== undefined ? { transportMode: input.transportMode } : {}),
      ...(input.partnerId !== undefined ? { partnerId: input.partnerId } : {}),
      ...(input.deptCode !== undefined ? { deptCode: input.deptCode } : {}),
    },
    include: {
      partner: true,
      declaration: true,
      lines: { include: { nomenclature: true }, orderBy: { lineNumber: "asc" } },
    },
  });
}

export async function deleteInvoice(invoiceId: string) {
  return prisma.$transaction([
    prisma.invoiceLine.deleteMany({ where: { headerId: invoiceId } }),
    prisma.invoiceHeader.delete({ where: { id: invoiceId } }),
  ]);
}
