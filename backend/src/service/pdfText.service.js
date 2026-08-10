import {
  extractText,
  getDocumentProxy,
} from "unpdf";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * PDF buffer se text extract karega.
 */
export async function extractPdfTextFromBuffer(
  buffer,
) {
  if (
    !buffer ||
    !Buffer.isBuffer(buffer)
  ) {
    throw new ApiError(
      400,
      "Valid PDF buffer is required",
    );
  }

  try {
    const pdf =
      await getDocumentProxy(
        new Uint8Array(buffer),
      );

    const result =
      await extractText(
        pdf,
        {
          mergePages: true,
        },
      );

    const text =
      String(
        result?.text || "",
      )
        .replace(
          /\r\n/g,
          "\n",
        )
        .replace(
          /\n{3,}/g,
          "\n\n",
        )
        .trim();

    if (!text) {
      throw new ApiError(
        400,
        "No readable text found in PDF",
      );
    }

    return {
      text,

      pageCount:
        pdf.numPages ?? null,
    };
  } catch (error) {
    if (
      error instanceof
      ApiError
    ) {
      throw error;
    }

    console.error(
      "PDF text extraction failed:",
      error,
    );

    throw new ApiError(
      500,
      "Failed to extract text from PDF",
    );
  }
}