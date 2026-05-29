import { Router } from "express";
import { companyRouter } from "./companyRouter.ts";

export const router = Router();

router.use("/api", companyRouter);

