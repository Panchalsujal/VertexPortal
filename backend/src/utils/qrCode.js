import QRCode from "qrcode";

import { ApiError } from "./ApiError.js";

export async function generateQrCodeBuffer(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    throw new ApiError(500, "QR code value is required");
  }

  try {
    return await QRCode.toBuffer(normalizedValue, {
      type: "png",
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    throw new ApiError(
      500,
      `Unable to generate certificate QR code: ${error.message}`,
    );
  }
}
