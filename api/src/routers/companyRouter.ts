import { Router } from "express";
import * as companyController from "../controllers/companyController.ts";

export const companyRouter = Router();

companyRouter.get("/companies", companyController.getCompanies);
companyRouter.get("/companies/:companyId", companyController.getCompanyById);
companyRouter.post("/companies", companyController.createCompany);