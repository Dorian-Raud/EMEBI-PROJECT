import type { Request, Response } from "express";
import * as partnerService from "../services/partnerService.ts";

type PartnerParams = { partnerId: string };

export const getPartners = async (req: Request, res: Response) => {
  const companyId = typeof req.query.companyId === "string" ? req.query.companyId : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;

  const partners = await partnerService.listPartners({ companyId, q });
  res.json(partners);
};

export const getPartnerById = async (req: Request<PartnerParams>, res: Response) => {
  const { partnerId } = req.params;
  const partner = await partnerService.getPartnerById(partnerId);
  if (!partner) return res.status(404).json({ error: "Tiers non trouvé" });
  res.json(partner);
};

export const createPartner = async (req: Request, res: Response) => {
  try {
    const { name, vatNumber, isoCode, companyId, deptCode } = req.body ?? {};

    if (!name || !vatNumber || !isoCode || !companyId) {
      return res.status(400).json({
        error: "Tous les champs (name, vatNumber, isoCode, companyId) sont obligatoires.",
      });
    }

    const created = await partnerService.createPartner({
      name,
      vatNumber,
      isoCode,
      companyId,
      deptCode: deptCode ?? null,
    });

    res.status(201).json(created);
  } catch (error: any) {
    // On log l'erreur complète côté serveur (DB, Prisma, etc.)
    console.error("createPartner error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Un tiers avec ce numéro de TVA existe déjà." });
    }
    if (error?.code === "P2003") {
      return res.status(400).json({
        error: "Pays (code ISO) invalide ou absent du référentiel. Lance npm run db:seed dans api/.",
      });
    }
    res.status(500).json({ error: "Erreur interne du serveur lors de la création." });
  }
};

export const updatePartner = async (req: Request<PartnerParams>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { name, vatNumber, isoCode, deptCode } = req.body ?? {};

    const updated = await partnerService.updatePartner(partnerId, {
      ...(name !== undefined ? { name } : {}),
      ...(vatNumber !== undefined ? { vatNumber } : {}),
      ...(isoCode !== undefined ? { isoCode } : {}),
      ...(deptCode !== undefined ? { deptCode } : {}),
    });

    res.json(updated);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Tiers non trouvé" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Un tiers avec ce numéro de TVA existe déjà." });
    }
    res.status(500).json({ error: "Erreur interne du serveur lors de la mise à jour." });
  }
};

export const deletePartner = async (req: Request<PartnerParams>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : undefined;

    if (!companyId) {
      return res.status(400).json({ error: "companyId est obligatoire." });
    }

    await partnerService.deletePartner(partnerId, companyId);
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Association tiers/société non trouvée." });
    }
    res.status(500).json({ error: "Erreur interne du serveur lors de la suppression." });
  }
};

