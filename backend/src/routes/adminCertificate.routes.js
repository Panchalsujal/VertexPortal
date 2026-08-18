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
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));
router.post(
  "/issue",
  auditLogAction("CERTIFICATE_ISSUED", "Certificate"),
  issueCertificateController,
);

router.get("/issue-queue", getCertificateIssueQueueController);

router.post("/retry-bulk", bulkRetryCertificateIssuesController);

router.post("/retry/:enrollmentId", retryCertificateIssueController);

router.get("/", getAdminCertificatesController);

router.get("/:certificateId/download", downloadCertificateController);

router.patch(
  "/:certificateId/revoke",
  auditLogAction("CERTIFICATE_REVOKED", "Certificate", (req) => req.params.certificateId),
  revokeCertificateController,
);

router.patch(
  "/:certificateId/restore",
  auditLogAction("CERTIFICATE_RESTORED", "Certificate", (req) => req.params.certificateId),
  restoreCertificateController,
);

router.post(
  "/:certificateId/regenerate-pdf",
  auditLogAction("CERTIFICATE_PDF_REGENERATED", "Certificate", (req) => req.params.certificateId),
  regenerateCertificatePdfController,
);  

export default router;
