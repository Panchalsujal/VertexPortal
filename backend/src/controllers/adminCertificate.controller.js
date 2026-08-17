import { asyncHandler } from "../utils/asyncHandler.js";

import {
  issueCertificate,
  getAdminCertificates,
  getCertificateIssueQueue,
  retryCertificateIssue,
  bulkRetryCertificateIssues,
  getCertificateDownload,
  regenerateCertificatePdf,
  revokeCertificate,
  restoreCertificate,
} from "../service/certificate.service.js";

import { logAdminAction } from "../service/adminAuditLogger.service.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { renderCacheService } from "../service/renderCache.service.js";

export const issueCertificateController = asyncHandler(async (req, res) => {
  const { studentId, courseId, enrollmentId } = req.body || {};

  const result = await issueCertificate({
    studentId,
    courseId,
    enrollmentId,
  });

  if (result.created) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.CERTIFICATE_ISSUED,

      resourceType: "certificate",

      resourceId: result.certificate._id,

      description: `Certificate "${result.certificate.certificateNumber}" issued`,

      before: null,

      after: {
        status: result.certificate.status,
        student: result.certificate.student,
        course: result.certificate.course,
        issuedAt: result.certificate.issuedAt,
        certificateNumber: result.certificate.certificateNumber,
      },

      metadata: {
        studentName: result.certificate.studentName,
        courseTitle: result.certificate.courseTitle,
      },
    });
  }

  return res.status(result.created ? 201 : 200).json({
    success: true,
    message: result.message,
    certificate: result.certificate,
  });
});

export const getAdminCertificatesController = asyncHandler(async (req, res) => {
  const result = await getAdminCertificates(req.query);

  return res.status(200).json({
    success: true,
    message: "Certificates fetched successfully",
    ...result,
  });
});

export const revokeCertificateController = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const { revocationReason, reason } = req.body || {};

  const result = await revokeCertificate({
    certificateId,
    revokedBy: req.user.id,
    revocationReason: revocationReason || reason,
  });

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.CERTIFICATE_REVOKED,

      resourceType: "certificate",

      resourceId: result.certificate._id,

      description: `Certificate "${result.certificate.certificateNumber}" revoked`,

      before: result.before,
      after: result.after,

      metadata: {
        certificateNumber: result.certificate.certificateNumber,
        studentName: result.certificate.studentName,
        courseTitle: result.certificate.courseTitle,
      },
    });
  }

  if (result.certificate?.verificationCode) {
    renderCacheService.purgeByTag(`certificate:${result.certificate.verificationCode}`);
  }
  if (result.certificate?.certificateNumber) {
    renderCacheService.purgeByTag(`certificate:${result.certificate.certificateNumber}`);
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    certificate: result.certificate,
  });
});

export const restoreCertificateController = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const result = await restoreCertificate(certificateId);

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.CERTIFICATE_RESTORED,

      resourceType: "certificate",

      resourceId: result.certificate._id,

      description: `Certificate "${result.certificate.certificateNumber}" restored`,

      before: result.before,
      after: result.after,

      metadata: {
        certificateNumber: result.certificate.certificateNumber,
        studentName: result.certificate.studentName,
        courseTitle: result.certificate.courseTitle,
      },
    });
  }

  if (result.certificate?.verificationCode) {
    renderCacheService.purgeByTag(`certificate:${result.certificate.verificationCode}`);
  }
  if (result.certificate?.certificateNumber) {
    renderCacheService.purgeByTag(`certificate:${result.certificate.certificateNumber}`);
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    certificate: result.certificate,
  });
});

export const retryCertificateIssueController = asyncHandler(
  async (req, res) => {
    const { enrollmentId } = req.params;

    const result = await retryCertificateIssue(enrollmentId);

    /*
     * Certificate retry se new certificate issue hua
     * ho to audit log create karenge.
     */
    if (result.created) {
      await logAdminAction(req, {
        action: AUDIT_ACTIONS.CERTIFICATE_ISSUED,

        resourceType: "certificate",

        resourceId: result.certificate._id,

        description: `Certificate "${result.certificate.certificateNumber}" issued through retry`,

        before: {
          certificateStatus: "failed",
        },

        after: {
          certificateStatus: "issued",
          certificateNumber: result.certificate.certificateNumber,
          issuedAt: result.certificate.issuedAt,
        },

        metadata: {
          enrollmentId,
          studentName: result.certificate.studentName,
          courseTitle: result.certificate.courseTitle,
          source: "admin_retry",
        },
      });
    }

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.message,
      certificate: result.certificate,
    });
  },
);

export const getCertificateIssueQueueController = asyncHandler(
  async (req, res) => {
    const result = await getCertificateIssueQueue(req.query);

    return res.status(200).json({
      success: true,
      message: "Certificate issue queue fetched successfully",
      ...result,
    });
  },
);

export const bulkRetryCertificateIssuesController = asyncHandler(
  async (req, res) => {
    const { enrollmentIds } = req.body || {};

    const result = await bulkRetryCertificateIssues(enrollmentIds);

    /*
     * Successfully created certificates ke liye
     * audit logs create karenge.
     */
    for (const item of result.results) {
      if (item.success && item.created && item.certificate) {
        await logAdminAction(req, {
          action: AUDIT_ACTIONS.CERTIFICATE_ISSUED,

          resourceType: "certificate",

          resourceId: item.certificate._id,

          description: `Certificate "${item.certificate.certificateNumber}" issued through bulk retry`,

          before: {
            certificateStatus: "failed",
          },

          after: {
            certificateStatus: "issued",

            certificateNumber: item.certificate.certificateNumber,

            issuedAt: item.certificate.issuedAt,
          },

          metadata: {
            enrollmentId: item.enrollmentId,

            studentName: item.certificate.studentName,

            courseTitle: item.certificate.courseTitle,

            source: "admin_bulk_retry",
          },
        });
      }
    }

    return res.status(200).json({
      success: result.summary.successful > 0,

      message:
        result.summary.failed === 0
          ? "All certificate retries completed successfully"
          : "Certificate retries completed with some failures",

      ...result,
    });
  },
);

export const downloadCertificateController = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const result = await getCertificateDownload({
    certificateId,
    requesterId: req.user.id,
    requesterRole: req.user.role,
  });

  const downloadUrl = result.downloadUrl;
  const fileName = `Certificate-${result.certificateNumber || 'completion'}.pdf`;

  if (downloadUrl.startsWith("data:application/pdf;base64,")) {
    const base64Data = downloadUrl.replace("data:application/pdf;base64,", "");
    const pdfBuffer = Buffer.from(base64Data, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  }

  if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
    try {
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(pdfBuffer);
      }
    } catch (err) {
      console.error("PDF CDN fetch error, falling back to JSON downloadUrl:", err);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Certificate download URL fetched successfully",
    certificate: result,
  });
});

export const regenerateCertificatePdfController = asyncHandler(
  async (req, res) => {
    const { certificateId } = req.params;

    const result = await regenerateCertificatePdf(certificateId);

    await logAdminAction(req, {
      action: AUDIT_ACTIONS.CERTIFICATE_PDF_REGENERATED,

      resourceType: "certificate",

      resourceId: result.certificate._id,

      description: `Certificate "${result.certificate.certificateNumber}" PDF regenerated`,

      metadata: {
        certificateNumber: result.certificate.certificateNumber,

        studentName: result.certificate.studentName,

        courseTitle: result.certificate.courseTitle,
      },
    });

    if (result.certificate?.verificationCode) {
      renderCacheService.purgeByTag(`certificate:${result.certificate.verificationCode}`);
    }
    if (result.certificate?.certificateNumber) {
      renderCacheService.purgeByTag(`certificate:${result.certificate.certificateNumber}`);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      certificate: result.certificate,
    });
  },
);
