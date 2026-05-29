import express from "express";
import cors from "cors";
import { config } from "../config.ts";
import { router } from "./routers/index.ts"; 

export const app = express(); 

app.use(express.json());
app.use(cors({ origin: config.allowedOrigin, credentials: true }));

app.use(router);
