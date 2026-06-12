import type { Request, Response } from "express";
import { generateEtatPdf } from "../services/etatPdfService.ts";
import type { EtatFlow } from "../services/etatPdfService.ts";

function parseEtatFlow(value: unknown): EtatFlow | undefined {
  if (value === "INTRODUCTION" || value === "EXPEDITION" || value === "FISCALE") {
    return value;
  }
  return undefined;
}

export async function getEtatPdf(req: Request, res: Response) {
  const companyId = String(req.query.companyId ?? "");
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const flow = parseEtatFlow(req.query.flow);

  if (!companyId) return res.status(400).json({ error: "companyId est requis" });
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "month invalide (1-12)" });
  }
  if (!Number.isInteger(year)) return res.status(400).json({ error: "year invalide" });
  if (!flow) return res.status(400).json({ error: "flow invalide (INTRODUCTION | EXPEDITION | FISCALE)" });

  try {
    const result = await generateEtatPdf(companyId, month, year, flow);
    if (!result) return res.status(404).json({ error: "Aucune facture pour cet état" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (err) {
    console.error("Erreur génération PDF état:", err);
    return res.status(500).json({ error: "Impossible de générer le PDF" });
  }
}
