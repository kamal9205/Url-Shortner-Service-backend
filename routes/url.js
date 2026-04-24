import { Router } from "express";
import {handleGenerateNewUrl, handleGetAnalytics}  from "../controllers/url.js";
import { optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

router.post("/", optionalAuthenticate, handleGenerateNewUrl);
router.get("/analytics/:shortId",handleGetAnalytics)

export default router;