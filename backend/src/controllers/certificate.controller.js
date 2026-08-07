import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  getCertificateDownload,
} from "../service/certificate.service.js";

export const issueCertificateController = asyncHandler(async (req, res) => {
  const { studentId, courseId, enrollmentId } = req.body || {};

  const result = await issueCertificate({
    studentId,
    courseId,
    enrollmentId,
  });

  return res.status(result.created ? 201 : 200).json({
    success: true,
    message: result.message,
    certificate: result.certificate,
  });
});

export const getMyCertificatesController = asyncHandler(async (req, res) => {
  const certificates = await getMyCertificates(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Certificates fetched successfully",
    certificates,
  });
});

export const getMyCertificateByIdController = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const certificate = await getCertificateById({
    certificateId,
    studentId: req.user.id,
  });

  return res.status(200).json({
    success: true,
    message: "Certificate fetched successfully",
    certificate,
  });
});

export const verifyCertificateController = asyncHandler(async (req, res) => {
  const { verificationCode } = req.params;

  const result = await verifyCertificate(verificationCode);

  return res.status(200).json({
    success: true,
    message: result.valid
      ? "Certificate is valid"
      : "Certificate has been revoked",
    ...result,
  });
});

export const downloadMyCertificateController = asyncHandler(
  async (req, res) => {
    const { certificateId } = req.params;

    const result = await getCertificateDownload({
      certificateId,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Certificate download URL fetched successfully",
      certificate: result,
    });
  },
);
