import imagekit from "../service/imagekit.js";
import { ApiError } from "../utils/ApiError.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

function sanitizeFileName(fileName) {
  return String(fileName || "assignment-file")
    .trim()
    .replace(/[^\w.\-]+/g, "-");
}

export async function uploadAssignmentSubmissionFiles({
  files,
  assignmentId,
  studentId,
  attemptNumber,
}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadedFiles = [];

  try {
    for (const file of files) {
      if (!file?.buffer) {
        throw new ApiError(400, "Invalid assignment submission file");
      }

      const safeFileName = sanitizeFileName(file.originalname);

      const fileName = `${Date.now()}-${safeFileName}`;

      const uploadResult = await circuitBreakers.imagekit.fire(() =>
        imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName,
          folder: `/navgujaratacademy/assignments/${assignmentId}/${studentId}/attempt-${attemptNumber}`,
          useUniqueFileName: true,
          tags: [
            "assignment-submission",
            `assignment-${assignmentId}`,
            `student-${studentId}`,
          ],
        })
      );

      uploadedFiles.push({
        fileUrl: uploadResult.url,
        fileId: uploadResult.fileId,

        fileName: file.originalname,

        mimeType: file.mimetype,

        fileSizeInBytes: file.size,
      });
    }

    return uploadedFiles;
  } catch (error) {
    /*
     * Partial upload hua ho to cleanup ideally yahan
     * karna chahiye.
     *
     * Abhi error propagate kar rahe hain.
     */
    throw error;
  }
}
