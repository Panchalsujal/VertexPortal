import PDFDocument from "pdfkit";

import { generateQrCodeBuffer } from "../utils/qrCode.js";

/**
 * Certificate PDF ko memory Buffer me generate karta hai.
 */
export async function generateCertificatePdf({
  certificateNumber,
  studentName,
  courseTitle,
  instructorName,
  completedAt,
  issuedAt,
  verificationCode,
  verificationUrl,
}) {
  /*
   * QR code PDF create hone se pehle generate hoga.
   */
  const qrCodeBuffer = verificationUrl
    ? await generateQrCodeBuffer(verificationUrl)
    : null;

  /*
   * Temporary debug.
   * QR confirm hone ke baad console.log remove kar sakte ho.
   */
  console.log({
    verificationUrl,
    qrGenerated: Buffer.isBuffer(qrCodeBuffer),
    qrSize: qrCodeBuffer?.length ?? 0,
  });

  return new Promise((resolve, reject) => {
    try {
      const document = new PDFDocument({
        size: "A4",
        layout: "landscape",

        margins: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        },

        info: {
          Title: `Certificate - ${studentName}`,
          Author: "VertexPortal",
          Subject: `Course completion certificate for ${courseTitle}`,
          Keywords:
            "certificate, course completion, VertexPortal",
        },
      });

      const chunks = [];

      document.on("data", (chunk) => {
        chunks.push(chunk);
      });

      document.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      document.on("error", (error) => {
        reject(error);
      });

      const pageWidth = document.page.width;
      const pageHeight = document.page.height;

      /*
       * Outer border
       */
      document
        .lineWidth(4)
        .rect(
          20,
          20,
          pageWidth - 40,
          pageHeight - 40,
        )
        .stroke();

      /*
       * Inner border
       */
      document
        .lineWidth(1)
        .rect(
          32,
          32,
          pageWidth - 64,
          pageHeight - 64,
        )
        .stroke();

      /*
       * Platform name
       */
      document
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(
          "VERTEXPORTAL",
          0,
          62,
          {
            align: "center",
          },
        );

      document
        .font("Helvetica")
        .fontSize(11)
        .text(
          "Learning Management System",
          {
            align: "center",
          },
        );

      document.moveDown(1.4);

      /*
       * Certificate heading
       */
      document
        .font("Helvetica-Bold")
        .fontSize(34)
        .text(
          "CERTIFICATE OF COMPLETION",
          {
            align: "center",
          },
        );

      document.moveDown(0.8);

      document
        .font("Helvetica")
        .fontSize(15)
        .text(
          "This certificate is proudly presented to",
          {
            align: "center",
          },
        );

      document.moveDown(0.6);

      /*
       * Student name
       */
      document
        .font("Helvetica-BoldOblique")
        .fontSize(31)
        .text(
          studentName,
          {
            align: "center",
            underline: true,
          },
        );

      document.moveDown(0.7);

      document
        .font("Helvetica")
        .fontSize(15)
        .text(
          "for successfully completing the course",
          {
            align: "center",
          },
        );

      document.moveDown(0.6);

      /*
       * Course title
       */
      document
        .font("Helvetica-Bold")
        .fontSize(23)
        .text(
          courseTitle,
          {
            align: "center",
          },
        );

      document.moveDown(0.6);

      const formattedCompletionDate =
        new Date(completedAt).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        );

      document
        .font("Helvetica")
        .fontSize(13)
        .text(
          `Completed on ${formattedCompletionDate}`,
          {
            align: "center",
          },
        );

      /*
       * Signature section
       */
      const signatureY = pageHeight - 150;

      document
        .moveTo(90, signatureY)
        .lineTo(275, signatureY)
        .stroke();

      document
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          instructorName ||
            "Course Instructor",
          90,
          signatureY + 8,
          {
            width: 185,
            align: "center",
          },
        );

      document
        .font("Helvetica")
        .fontSize(10)
        .text(
          "Instructor",
          90,
          signatureY + 27,
          {
            width: 185,
            align: "center",
          },
        );

      const formattedIssuedDate =
        new Date(issuedAt).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        );

      document
        .moveTo(
          pageWidth - 275,
          signatureY,
        )
        .lineTo(
          pageWidth - 90,
          signatureY,
        )
        .stroke();

      document
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          formattedIssuedDate,
          pageWidth - 275,
          signatureY + 8,
          {
            width: 185,
            align: "center",
          },
        );

      document
        .font("Helvetica")
        .fontSize(10)
        .text(
          "Issue Date",
          pageWidth - 275,
          signatureY + 27,
          {
            width: 185,
            align: "center",
          },
        );

      /*
       * QR Code section
       */
      if (Buffer.isBuffer(qrCodeBuffer)) {
        const qrSize = 90;

        const qrX =
          pageWidth / 2 -
          qrSize / 2;

        const qrY =
          pageHeight - 170;

        /*
         * QR ke peeche white background.
         */
        document
          .save()
          .fillColor("white")
          .rect(
            qrX - 6,
            qrY - 6,
            qrSize + 12,
            qrSize + 28,
          )
          .fill()
          .restore();

        document.image(
          qrCodeBuffer,
          qrX,
          qrY,
          {
            width: qrSize,
            height: qrSize,
          },
        );

        document
          .fillColor("black")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(
            "Scan to verify",
            qrX - 10,
            qrY + qrSize + 5,
            {
              width: qrSize + 20,
              align: "center",
            },
          );
      }

      /*
       * Certificate information
       */
      document
        .fillColor("black")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Certificate Number: ${certificateNumber}`,
          55,
          pageHeight - 70,
        );

      document.text(
        `Verification Code: ${verificationCode}`,
        55,
        pageHeight - 56,
      );

      if (verificationUrl) {
        document
          .fillColor("blue")
          .text(
            `Verify: ${verificationUrl}`,
            55,
            pageHeight - 42,
            {
              link: verificationUrl,
              underline: true,
            },
          )
          .fillColor("black");
      }

      /*
       * PDF generation finish.
       */
      document.end();
    } catch (error) {
      reject(error);
    }
  });
}