import PDFDocument from "pdfkit";
import { generateQrCodeBuffer } from "../utils/qrCode.js";

/**
 * Certificate PDF generator using executive Learnova layout.
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
  const qrCodeBuffer = verificationUrl
    ? await generateQrCodeBuffer(verificationUrl)
    : null;

  return new Promise((resolve, reject) => {
    try {
      const document = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: {
          top: 30,
          right: 30,
          bottom: 30,
          left: 30,
        },
        info: {
          Title: `Certificate - ${studentName}`,
          Author: "VertexPortal",
          Subject: `Course completion certificate for ${courseTitle}`,
          Keywords: "certificate, course completion, VertexPortal",
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

      const W = document.page.width;
      const H = document.page.height;

      /*
       * 1. Soft Warm Background Fill
       */
      document.save();
      document.rect(0, 0, W, H).fill("#FDFCFE");
      document.restore();

      /*
       * 2. Outer & Inner Executive Borders
       */
      // Outer Royal Purple Border
      document
        .lineWidth(4)
        .strokeColor("#6C5CE7")
        .rect(18, 18, W - 36, H - 36)
        .stroke();

      // Inner Metallic Gold Border
      document
        .lineWidth(1.5)
        .strokeColor("#D4AF37")
        .rect(25, 25, W - 50, H - 50)
        .stroke();

      // Thin Inner Slate Framing Line
      document
        .lineWidth(0.5)
        .strokeColor("#CBD5E1")
        .rect(29, 29, W - 58, H - 58)
        .stroke();

      /*
       * 3. Official Seal Emblem Graphic (Top Right Header Badge)
       */
      const sealX = W - 75;
      const sealY = 62;
      document.save();
      document.circle(sealX, sealY, 24).fillAndStroke("#FEF3C7", "#D4AF37");
      document.circle(sealX, sealY, 20).strokeColor("#6C5CE7").lineWidth(1.2).stroke();
      document
        .fillColor("#4C1D95")
        .font("Helvetica-Bold")
        .fontSize(7)
        .text("OFFICIAL", sealX - 25, sealY - 10, { width: 50, align: "center" })
        .text("SEAL", sealX - 25, sealY - 1, { width: 50, align: "center" })
        .fillColor("#D4AF37")
        .fontSize(6)
        .text("VERIFIED", sealX - 25, sealY + 8, { width: 50, align: "center" });
      document.restore();

      /*
       * 4. Header Branding
       */
      document
        .fillColor("#6C5CE7")
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("V E R T E X P O R T A L", 0, 48, {
          align: "center",
        });

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text("LEARNING MANAGEMENT SYSTEM", 0, 72, {
          align: "center",
        });

      // Gold Accent Rule under Header
      const midX = W / 2;
      document
        .lineWidth(1)
        .strokeColor("#D4AF37")
        .moveTo(midX - 60, 88)
        .lineTo(midX + 60, 88)
        .stroke();

      /*
       * 5. Certificate Main Title
       */
      document
        .fillColor("#1E1B4B")
        .font("Helvetica-Bold")
        .fontSize(30)
        .text("CERTIFICATE OF COMPLETION", 0, 108, {
          align: "center",
        });

      // Presentation Line
      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(12)
        .text("THIS IS PROUDLY PRESENTED TO", 0, 150, {
          align: "center",
        });

      /*
       * 6. Student Name & Centered Gold Accent Line
       */
      document
        .fillColor("#4C1D95")
        .font("Helvetica-BoldOblique")
        .fontSize(30)
        .text(studentName || "Student", 0, 174, {
          align: "center",
        });

      // Clean Gold Accent Rule under Student Name
      document
        .lineWidth(1.5)
        .strokeColor("#D4AF37")
        .moveTo(midX - 120, 214)
        .lineTo(midX + 120, 214)
        .stroke();

      /*
       * 7. Course Title & Completion Statement
       */
      document
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(12)
        .text("for successfully completing the course", 0, 226, {
          align: "center",
        });

      // Format Course Title to Proper Title Case
      const formattedCourseTitle = String(courseTitle || "Course Completion")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      document
        .fillColor("#1E1B4B")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(formattedCourseTitle, 0, 248, {
          align: "center",
        });

      const formattedCompletionDate = new Date(completedAt || Date.now()).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(11)
        .text(`Completed on ${formattedCompletionDate}`, 0, 280, {
          align: "center",
        });

      /*
       * 8. Signatures Section (Left: Instructor, Right: Issue Date)
       */
      const sigY = H - 120;
      const leftSigX = 140;
      const rightSigX = W - 290;
      const sigLineWidth = 150;

      const displayInstructor =
        instructorName && instructorName.trim() !== "" && instructorName.trim() !== "Course Instructor"
          ? instructorName.trim()
          : "VertexPortal Academic Board";

      // Left: Instructor Signature Line
      document
        .lineWidth(1)
        .strokeColor("#94A3B8")
        .moveTo(leftSigX, sigY)
        .lineTo(leftSigX + sigLineWidth, sigY)
        .stroke();

      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(displayInstructor, leftSigX, sigY + 8, {
          width: sigLineWidth,
          align: "center",
        });

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text("Course Instructor", leftSigX, sigY + 22, {
          width: sigLineWidth,
          align: "center",
        });

      // Right: Issue Date Signature Line
      const formattedIssuedDate = new Date(issuedAt || Date.now()).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );

      document
        .lineWidth(1)
        .strokeColor("#94A3B8")
        .moveTo(rightSigX, sigY)
        .lineTo(rightSigX + sigLineWidth, sigY)
        .stroke();

      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(formattedIssuedDate, rightSigX, sigY + 8, {
          width: sigLineWidth,
          align: "center",
        });

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text("Date of Issuance", rightSigX, sigY + 22, {
          width: sigLineWidth,
          align: "center",
        });

      /*
       * 9. QR Code Section (Centered at Bottom)
       */
      if (Buffer.isBuffer(qrCodeBuffer)) {
        const qrSize = 65;
        const qrX = W / 2 - qrSize / 2;
        const qrY = H - 148;

        document.save();
        document
          .fillColor("white")
          .strokeColor("#CBD5E1")
          .lineWidth(1)
          .rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 22)
          .fillAndStroke();

        document.image(qrCodeBuffer, qrX, qrY, {
          width: qrSize,
          height: qrSize,
        });

        document
          .fillColor("#475569")
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text("Scan to verify", qrX - 10, qrY + qrSize + 3, {
            width: qrSize + 20,
            align: "center",
          });
        document.restore();
      }

      /*
       * 10. Footer Metadata (Certificate Number & Verification Code)
       */
      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(8)
        .text(`Certificate No: ${certificateNumber}`, 45, H - 48);

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(8)
        .text(`Verification Code: ${verificationCode}`, W - 320, H - 48, {
          width: 275,
          align: "right",
        });

      document.end();
    } catch (error) {
      reject(error);
    }
  });
}