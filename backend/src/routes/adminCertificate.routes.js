import { Router } from "express";

import {
  issueCertificateController,
  getAdminCertificatesController,
  getCertificateIssueQueueController,
  retryCertificateIssueController,
  bulkRetryCertificateIssuesController,
  downloadCertificateController,
  regenerateCertificatePdfController,
  revokeCertificateController,
  restoreCertificateController,
} from "../controllers/adminCertificate.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));
router.post("/issue", issueCertificateController);

router.get("/issue-queue", getCertificateIssueQueueController);

router.post("/retry-bulk", bulkRetryCertificateIssuesController);

router.post("/retry/:enrollmentId", retryCertificateIssueController);

router.get("/", getAdminCertificatesController);

router.get("/:certificateId/download", downloadCertificateController);

router.patch("/:certificateId/revoke", revokeCertificateController);

router.patch("/:certificateId/restore", restoreCertificateController);

router.post(
  "/:certificateId/regenerate-pdf",
  regenerateCertificatePdfController,
);  

export default router;
