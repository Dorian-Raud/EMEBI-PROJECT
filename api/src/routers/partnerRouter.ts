import { Router } from "express";
import * as partnerController from "../controllers/partnerController.ts";

export const partnerRouter = Router();

partnerRouter.get("/partners", partnerController.getPartners);
partnerRouter.get("/partners/:partnerId", partnerController.getPartnerById);
partnerRouter.post("/partners", partnerController.createPartner);
partnerRouter.put("/partners/:partnerId", partnerController.updatePartner);
partnerRouter.delete("/partners/:partnerId", partnerController.deletePartner);

