import { Router } from "express";
import { getEtatPdf } from "../controllers/etatController.ts";

export const etatRouter = Router();

etatRouter.get("/pdf", getEtatPdf);
