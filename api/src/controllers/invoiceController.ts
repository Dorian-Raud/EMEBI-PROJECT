import type { Request, Response } from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoice,
} from "../services/invoiceService.ts";
import type { Flow } from "../../prisma/generated/client/index.js";

function parseFlow(value: unknown): Flow | undefined {
  if (value === "INTRODUCTION" || value === "EXPEDITION") return value;
  return undefined;
}

export async function getInvoices(req: Request, res: Response) {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) {
    return res.status(400).json({ error: "companyId est requis" });
  }

  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;

  const invoices = await listInvoices({
    companyId,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    flow: parseFlow(req.query.flow),
    month: Number.isFinite(month) ? month : undefined,
    year: Number.isFinite(year) ? year : undefined,
  });

  return res.json(invoices);
}

export async function getInvoice(req: Request, res: Response) {
  const invoice = await getInvoiceById(String(req.params.invoiceId));
  if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
  return res.json(invoice);
}

export async function postInvoice(req: Request, res: Response) {
  const body = req.body ?? {};
  const companyId = String(body.companyId ?? "");
  const flow = parseFlow(body.flow);

  if (!companyId || !flow) {
    return res.status(400).json({ error: "companyId et flow sont requis" });
  }
  if (!body.invoiceNumber || !body.partnerId || !Array.isArray(body.lines)) {
    return res.status(400).json({ error: "Champs facture incomplets" });
  }

  try {
    const invoice = await createInvoice({
      companyId,
      flow,
      month: Number(body.month) || new Date().getMonth() + 1,
      year: Number(body.year) || new Date().getFullYear(),
      invoiceNumber: String(body.invoiceNumber),
      invoiceDate: body.invoiceDate ?? null,
      regime: String(body.regime ?? ""),
      transactionNature: String(body.transactionNature ?? ""),
      transportMode: body.transportMode ?? null,
      partnerId: String(body.partnerId),
      deptCode: body.deptCode,
      lines: body.lines,
    });
    return res.status(201).json(invoice);
  } catch (err: any) {
    if (err.code === "DUPLICATE_INVOICE") {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: "Impossible de créer la facture" });
  }
}

export async function putInvoice(req: Request, res: Response) {
  try {
    const invoice = await updateInvoice(String(req.params.invoiceId), req.body ?? {});
    return res.json(invoice);
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? err.code : null;
    if (code === "NOT_FOUND") return res.status(404).json({ error: "Facture introuvable" });
    return res.status(500).json({ error: "Impossible de mettre à jour la facture" });
  }
}

export async function removeInvoice(req: Request, res: Response) {
  try {
    await deleteInvoice(String(req.params.invoiceId));
    return res.status(204).send();
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? err.code : null;
    if (code === "P2025") return res.status(404).json({ error: "Facture introuvable" });
    return res.status(500).json({ error: "Impossible de supprimer la facture" });
  }
}
