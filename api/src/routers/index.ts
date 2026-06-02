import { Router } from "express";
import { companyRouter } from "./companyRouter.ts";
import { partnerRouter } from "./partnerRouter.ts";
import { invoiceRouter } from "./invoiceRouter.ts";

export const router = Router();

router.use("/api", companyRouter);
router.use("/api", partnerRouter);
router.use("/api/invoices", invoiceRouter);

