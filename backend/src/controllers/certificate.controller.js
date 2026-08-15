import { asyncHandler } from "../utils/asyncHandler.js";
import { config } from "../config/config.js";

import {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  getCertificateDownload,
  issueCertificate,
} from "../service/certificate.service.js";

import { generateCertificatePdf } from "../service/certificatePdf.service.js";

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

    const fileName = `Certificate-${result.certificateNumber || 'completion'}.pdf`;

    // Dynamically render fresh executive PDF certificate
    try {
      const rawFrontend =
        config.FRONTEND_URL ||
        process.env.FRONTEND_URL ||
        "https://vertex-mu-eight.vercel.app";

      const frontendBase = rawFrontend
        .split(",")[0]
        .trim()
        .replace(/\/+$/, "");

      const verificationUrl = `${frontendBase}/certificates/verify/${result.verificationCode}`;

      const pdfBuffer = await generateCertificatePdf({
        certificateNumber: result.certificateNumber,
        studentName: result.studentName,
        courseTitle: result.courseTitle,
        instructorName: result.instructorName || "Course Instructor",
        completedAt: result.completedAt || result.issuedAt,
        issuedAt: result.issuedAt,
        verificationCode: result.verificationCode,
        verificationUrl,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error("Dynamic PDF generation error, falling back to downloadUrl:", err);
    }

    if (result.downloadUrl?.startsWith("data:application/pdf;base64,")) {
      const base64Data = result.downloadUrl.replace("data:application/pdf;base64,", "");
      const pdfBuffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      return res.send(pdfBuffer);
    }

    if (result.downloadUrl?.startsWith("http://") || result.downloadUrl?.startsWith("https://")) {
      try {
        const response = await fetch(result.downloadUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const pdfBuffer = Buffer.from(arrayBuffer);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
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
  },
);
