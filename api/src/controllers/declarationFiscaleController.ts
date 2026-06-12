import type { Request, Response } from "express";
import {
  createDeclarationFiscale,
  listDeclarationsFiscales,
  getDeclarationFiscaleById,
  updateDeclarationFiscale,
  deleteDeclarationFiscale,
} from "../services/declarationFiscaleService.ts";

export async function getDeclarationsFiscales(req: Request, res: Response) {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId est requis" });

  try {
    const data = await listDeclarationsFiscales({
      companyId,
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Impossible de récupérer les déclarations fiscales" });
  }
}

export async function postDeclarationFiscale(req: Request, res: Response) {
  const body = req.body ?? {};

  if (!body.companyId || !body.partnerId || !body.invoiceNumber || !body.regime || !body.value) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    const data = await createDeclarationFiscale({
      companyId: String(body.companyId),
      month: Number(body.month) || new Date().getMonth() + 1,
      year: Number(body.year) || new Date().getFullYear(),
      invoiceNumber: String(body.invoiceNumber),
      invoiceDate: body.invoiceDate ?? null,
      regime: String(body.regime),
      value: Number(body.value),
      partnerId: String(body.partnerId),
    });
    return res.status(201).json(data);
  } catch (err: any) {
    if (err.code === "DUPLICATE_FISCAL") {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Impossible de créer la déclaration fiscale" });
  }
}

export async function getDeclarationFiscaleByIdHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  try {
    const data = await getDeclarationFiscaleById(id);
    if (!data) return res.status(404).json({ error: "Déclaration fiscale introuvable" });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Impossible de récupérer la déclaration fiscale" });
  }
}

export async function putDeclarationFiscale(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body ?? {};
  try {
    const data = await updateDeclarationFiscale(id, {
      ...(body.invoiceNumber !== undefined ? { invoiceNumber: String(body.invoiceNumber) } : {}),
      ...(body.invoiceDate !== undefined ? { invoiceDate: body.invoiceDate ?? null } : {}),
      ...(body.regime !== undefined ? { regime: String(body.regime) } : {}),
      ...(body.value !== undefined ? { value: Number(body.value) } : {}),
      ...(body.partnerId !== undefined ? { partnerId: String(body.partnerId) } : {}),
    });
    return res.json(data);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Déclaration fiscale introuvable" });
    console.error(err);
    return res.status(500).json({ error: "Impossible de mettre à jour la déclaration fiscale" });
  }
}

export async function deleteDeclarationFiscaleById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  try {
    await deleteDeclarationFiscale(id);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Impossible de supprimer la déclaration fiscale" });
  }
}