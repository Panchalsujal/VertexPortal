import multer from "multer";

const storage = multer.memoryStorage();

export const assignmentUpload = multer({
  storage,

  limits: {
    /*
     * Actual assignment-specific limit service me
     * validate hoga.
     *
     * Multer ka global upper limit 100MB rakh rahe hain.
     */
    fileSize: 100 * 1024 * 1024,

    files: 5,
  },
});
