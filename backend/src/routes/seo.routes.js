import express from "express";
import { getSitemapController } from "../controllers/seo.controller.js";

const router = express.Router();

router.get("/sitemap.xml", getSitemapController);

export default router;