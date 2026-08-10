import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import {
  createPaymentOrderController,
  verifyPaymentController,
} from "../controllers/order.controller.js";

const router = Router();

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("student"),
  createPaymentOrderController,
);

router.post(
  "/verify",
  authMiddleware,
  authorizeRoles("student"),
  verifyPaymentController,
);

export default router;