import { Router } from "express";
import {
  getInvoice,
  getInvoices,
  postInvoice,
  putInvoice,
  removeInvoice,
} from "../controllers/invoiceController.ts";

export const invoiceRouter = Router();

invoiceRouter.get("/", getInvoices);
invoiceRouter.get("/:invoiceId", getInvoice);
invoiceRouter.post("/", postInvoice);
invoiceRouter.put("/:invoiceId", putInvoice);
invoiceRouter.delete("/:invoiceId", removeInvoice);
