import { Router } from "express";
import {
  getDeclarationsFiscales,
  postDeclarationFiscale,
  deleteDeclarationFiscaleById,
} from "../controllers/declarationFiscaleController.ts";

export const declarationFiscaleRouter = Router();

declarationFiscaleRouter.get("/", getDeclarationsFiscales);
declarationFiscaleRouter.post("/", postDeclarationFiscale);
declarationFiscaleRouter.delete("/:id", deleteDeclarationFiscaleById);