import { Router } from "express";
import {handleGenerateNewUrl, handleGetAnalytics}  from "../controllers/url.js";

const router = Router();

router.post("/", handleGenerateNewUrl);
router.get("/analytics/:shortId",handleGetAnalytics)

export default router;