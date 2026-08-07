import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/msword", // doc
    "application/vnd.ms-powerpoint", // ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, DOC, DOCX, PPT and PPTX files are allowed"));
  }

  cb(null, true);
}

export const uploadLectureDocument = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit (ImageKit maximum single file limit)
  },
  fileFilter,
});