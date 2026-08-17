import imagekit from "../service/imagekit.js";
import { ApiError } from "../utils/ApiError.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

export async function uploadCertificatePdf({ pdfBuffer, certificateNumber }) {
  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new ApiError(500, "Invalid certificate PDF buffer");
  }

  const timestamp = Date.now();

  const fileName = `${certificateNumber}-${timestamp}.pdf`;

  try {
    const uploadResult = await circuitBreakers.imagekit.fire(() =>
      imagekit.upload({
        file: pdfBuffer.toString("base64"),
        fileName,
        folder: "/vertexportal/certificates",
        useUniqueFileName: false,
        overwriteFile: true,
        tags: ["certificate", "course-completion"],
      })
    );

    return {
      certificateUrl: uploadResult.url,
      certificateFileId: uploadResult.fileId,
    };
  } catch (error) {
    console.warn(
      "ImageKit certificate upload failed; using Data URI fallback:",
      error.message,
    );
    const dataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    return {
      certificateUrl: dataUri,
      certificateFileId: `fallback-${timestamp}`,
    };
  }
}
