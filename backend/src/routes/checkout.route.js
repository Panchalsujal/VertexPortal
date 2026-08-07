import express from "express";
import { checkoutPreviewController } from "../controllers/checkoutPreviewController.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.post(
  "/checkout/preview",
  authMiddleware,
  authorizeRoles("student"),
  checkoutPreviewController,
);

export default router;
