import type { Request, Response } from "express";

import { prisma } from "../models/index.ts"; 

import * as companyService from "../services/companyService.ts";

type CompanyParams = {
  companyId: string;
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name, siret, vatNumber } = req.body;

    // Validation
    if (!name || !siret || !vatNumber) {
      return res.status(400).json({ error: "Tous les champs (name, siret, vatNumber) sont obligatoires." });
    }

    const newCompany = await companyService.createCompany({ name, siret, vatNumber });
    
    res.status(201).json(newCompany);
  } catch (error: any) {
    // Si Prisma renvoie une erreur (ex: SIRET déjà existant)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Une société avec ce SIRET ou numéro de TVA existe déjà." });
    }
    res.status(500).json({ error: "Erreur interne du serveur lors de la création." });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  
  const companies = await prisma.company.findMany();

  res.json(companies);
};

export const getCompanyById = async (req: Request<CompanyParams>, res: Response) => {
  const { companyId } = req.params;

  const company = await prisma.company.findUnique({
    where: { id: companyId}
  })
  if (!company) {
    return res.status(404).json({ error: "Société non trouvée" });
  }

  res.json(company);
}; 

