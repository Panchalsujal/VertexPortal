import imagekit from "../service/imagekit.js";

import { ApiError } from "../utils/ApiError.js";

export async function uploadCertificatePdf({ pdfBuffer, certificateNumber }) {
  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new ApiError(500, "Invalid certificate PDF buffer");
  }

  const timestamp = Date.now();

  const fileName = `${certificateNumber}-${timestamp}.pdf`;

  const uploadResult = await imagekit.upload({
    file: pdfBuffer.toString("base64"),
    fileName,
    folder: "/vertexportal/certificates",
    useUniqueFileName: false,
    overwriteFile: true,
    tags: ["certificate", "course-completion"],
  });

  return {
    certificateUrl: uploadResult.url,
    certificateFileId: uploadResult.fileId,
  };
}
