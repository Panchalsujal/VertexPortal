import { Router } from "express";

import {
  getMyCertificatesController,
  getMyCertificateByIdController,
  downloadMyCertificateController,
  verifyCertificateController,
} from "../controllers/certificate.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get(
  "/verify/:verificationCode",
  verifyCertificateController,
);

router.get(
  "/me",
  authMiddleware,
  authorizeRoles("student"),
  getMyCertificatesController,
);

router.get(
  "/me/:certificateId/download",
  authMiddleware,
  authorizeRoles("student"),
  downloadMyCertificateController,
);

router.get(
  "/me/:certificateId",
  authMiddleware,
  authorizeRoles("student"),
  getMyCertificateByIdController,
);

export default router;
