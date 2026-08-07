import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("video/")) {
    return cb(new Error("Only video files are allowed"));
  }

  cb(null, true);
}

export const uploadLectureVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit (ImageKit maximum single file limit)
  },
});