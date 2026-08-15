import PDFDocument from "pdfkit";
import { generateQrCodeBuffer } from "../utils/qrCode.js";

/**
 * Modern Geometric Certificate PDF Generator (Photo 4 Reference Theme).
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
          top: 24,
          right: 24,
          bottom: 24,
          left: 24,
        },
        info: {
          Title: `Certificate of Completion - ${studentName}`,
          Author: "VertexPortal",
          Subject: `Certificate for ${courseTitle}`,
          Keywords: "certificate, completion, vertexportal",
        },
      });

      const chunks = [];
      document.on("data", (chunk) => chunks.push(chunk));
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", (error) => reject(error));

      const W = document.page.width;
      const H = document.page.height;

      /*
       * 1. Clean Crisp Background
       */
      document.save();
      document.rect(0, 0, W, H).fill("#FFFFFF");
      document.restore();

      /*
       * 2. Modern Geometric Crystal Mesh (Top-Right Corner)
       */
      document.save();

      // Top-Right Polygons
      // Polygon 1 - Light Cyan
      document
        .polygon([W, 0], [W - 180, 0], [W - 110, 70])
        .fill("#BAE6FD");

      // Polygon 2 - Vibrant Sky
      document
        .polygon([W - 180, 0], [W - 70, 0], [W - 110, 70])
        .fill("#7DD3FC");

      // Polygon 3 - Deep Ocean
      document
        .polygon([W, 0], [W, 110], [W - 60, 60])
        .fill("#0284C7");

      // Polygon 4 - Mid Blue
      document
        .polygon([W, 60], [W, 170], [W - 90, 120])
        .fill("#38BDF8");

      // Polygon 5 - Soft Sky Triangle
      document
        .polygon([W - 110, 70], [W - 40, 50], [W - 80, 130])
        .fill("#0EA5E9");

      // Polygon 6 - Cyan Accent
      document
        .polygon([W - 80, 130], [W, 150], [W - 40, 200])
        .fill("#7DD3FC");

      // Polygon 7 - Edge Triangle
      document
        .polygon([W - 140, 120], [W - 90, 140], [W - 120, 190])
        .fill("#38BDF8");

      /*
       * 3. Modern Geometric Crystal Mesh (Bottom-Left Corner)
       */
      // Polygon 1 - Light Sky
      document
        .polygon([0, H], [160, H], [90, H - 70])
        .fill("#BAE6FD");

      // Polygon 2 - Cyan
      document
        .polygon([0, H - 120], [0, H], [80, H - 60])
        .fill("#38BDF8");

      // Polygon 3 - Ocean Blue
      document
        .polygon([0, H - 180], [0, H - 90], [70, H - 130])
        .fill("#0284C7");

      // Polygon 4 - Soft Sky
      document
        .polygon([70, H - 130], [130, H - 110], [90, H - 70])
        .fill("#7DD3FC");

      // Polygon 5 - Deep Blue Accent
      document
        .polygon([130, H - 110], [180, H], [110, H])
        .fill("#0EA5E9");

      // Polygon 6 - Floating Cyan Crystal
      document
        .polygon([110, H - 160], [160, H - 130], [130, H - 190])
        .fill("#38BDF8");

      // Polygon 7 - Light Whisper Triangle
      document
        .polygon([0, H - 180], [60, H - 210], [40, H - 150])
        .fill("#E0F2FE");

      document.restore();

      /*
       * 4. Elegant Minimal Border Framing
       */
      document
        .lineWidth(1.2)
        .strokeColor("#38BDF8")
        .rect(26, 26, W - 52, H - 52)
        .stroke();

      /*
       * 5. Top Brand Header (Paper Plane + VERTEXPORTAL)
       */
      const logoY = 56;
      const midX = W / 2;

      // Draw Origami Paper Plane Logo
      document.save();
      document
        .polygon(
          [midX - 8, logoY],
          [midX + 16, logoY + 7],
          [midX - 4, logoY + 12],
          [midX - 1, logoY + 17]
        )
        .fill("#0284C7");

      document
        .polygon(
          [midX - 8, logoY],
          [midX - 4, logoY + 12],
          [midX - 12, logoY + 6]
        )
        .fill("#38BDF8");
      document.restore();

      // Brand Name
      document
        .fillColor("#0284C7")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("VERTEXPORTAL", 0, logoY + 22, {
          align: "center",
          characterSpacing: 2,
        });

      /*
       * 6. Certificate Main Title
       */
      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(28)
        .text("Certificate of Completion", 0, 120, {
          align: "center",
        });

      /*
       * 7. Recipient Name
       */
      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(30)
        .text(studentName || "Student", 0, 185, {
          align: "center",
        });

      /*
       * 8. Body Statement
       */
      const formattedCourseTitle = String(courseTitle || "Fullstack Development")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      document
        .fillColor("#334155")
        .font("Helvetica")
        .fontSize(12)
        .text(
          "has successfully completed the comprehensive training program and assessment on",
          0,
          235,
          {
            align: "center",
          }
        );

      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(15)
        .text(`${formattedCourseTitle}`, 0, 255, {
          align: "center",
        });

      document
        .fillColor("#334155")
        .font("Helvetica")
        .fontSize(12)
        .text("with outstanding performance through VertexPortal Learning System.", 0, 276, {
          align: "center",
        });

      /*
       * 9. Signature Section (Centered with Hand-Drawn Signature Line)
       */
      const sigY = 345;
      const sigX = midX - 60;

      // Realistic Handwritten Signature Curve
      document.save();
      document
        .lineWidth(1.8)
        .strokeColor("#0284C7")
        .moveTo(sigX + 10, sigY - 10)
        .bezierCurveTo(sigX + 25, sigY - 35, sigX + 45, sigY - 5, sigX + 60, sigY - 20)
        .bezierCurveTo(sigX + 75, sigY - 35, sigX + 90, sigY - 8, sigX + 115, sigY - 15)
        .stroke();
      document.restore();

      const displayInstructor =
        instructorName && instructorName.trim() !== "" && instructorName.trim() !== "Course Instructor"
          ? instructorName.trim()
          : "Hitesh Choudhary";

      document
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(displayInstructor, 0, sigY, {
          align: "center",
        });

      document
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text("Founder & CEO, VertexPortal", 0, sigY + 14, {
          align: "center",
        });

      /*
       * 10. Date of Certification
       */
      const formattedDate = new Date(completedAt || issuedAt || Date.now()).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "2-digit",
          year: "numeric",
        }
      );

      document
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(10)
        .text(`Date of certification:  ${formattedDate}`, 0, 420, {
          align: "center",
        });

      /*
       * 11. QR Code & Authentication Footer
       */
      if (Buffer.isBuffer(qrCodeBuffer)) {
        const qrSize = 46;
        const qrX = midX - qrSize / 2;
        const qrY = 445;

        document.image(qrCodeBuffer, qrX, qrY, {
          width: qrSize,
          height: qrSize,
        });
      }

      document
        .fillColor("#94A3B8")
        .font("Helvetica")
        .fontSize(7.5)
        .text(`Certificate Number: ${certificateNumber}`, 0, 502, {
          align: "center",
        });

      document
        .fillColor("#94A3B8")
        .font("Helvetica")
        .fontSize(7)
        .text(
          `For certificate authentication please visit: ${verificationUrl || "https://vertex-mu-eight.vercel.app/verify-certificate"}`,
          0,
          514,
          {
            align: "center",
          }
        );

      document.end();
    } catch (error) {
      reject(error);
    }
  });
}