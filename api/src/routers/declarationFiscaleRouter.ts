import { Router } from "express";
import {
  getDeclarationsFiscales,
  getDeclarationFiscaleByIdHandler,
  postDeclarationFiscale,
  putDeclarationFiscale,
  deleteDeclarationFiscaleById,
} from "../controllers/declarationFiscaleController.ts";

export const declarationFiscaleRouter = Router();

declarationFiscaleRouter.get("/", getDeclarationsFiscales);
declarationFiscaleRouter.get("/:id", getDeclarationFiscaleByIdHandler);
declarationFiscaleRouter.post("/", postDeclarationFiscale);
declarationFiscaleRouter.put("/:id", putDeclarationFiscale);
declarationFiscaleRouter.delete("/:id", deleteDeclarationFiscaleById);