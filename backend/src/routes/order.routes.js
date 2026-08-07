import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import { createPaymentOrderController ,verifyPaymentController} from "../controllers/order.controller.js";

const router = Router();

/**
 * @route POST /api/orders/create
 * @desc Create a new order for a student
 * @access Private (student)
 */
router.post(
  "/create",
  authMiddleware,
  authorizeRoles("student"),
  createPaymentOrderController,
);

/**
 * @route POST /api/orders/verify
 * @desc Verify a payment for an order
 * @access Private (student)
 */

router.post(
  "/verify",
  authMiddleware,
  authorizeRoles("student"),
  verifyPaymentController,
);
export default router;
