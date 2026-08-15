import mongoose from "mongoose";
import Certificate from "../models/certificate.model.js";
import Enrollment from "../models/enrollment.model.js";
import { config } from "../config/config.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import { createNotification } from "./notification.service.js";
import { dispatchNotification } from "./notification.service.js";

import { buildSearchFilter } from "../utils/search.js";

import { parseEnumQuery, parseSortQuery } from "../utils/queryParser.js";

import { validateObjectId, validateRequired } from "../utils/validator.js";

import {
  generateCertificateNumber,
  generateVerificationCode,
} from "../utils/certificate.js";

import { generateCertificatePdf } from "./certificatePdf.service.js";
import { uploadCertificatePdf } from "./certificateUpload.service.js";

import { ApiError } from "../utils/ApiError.js";

export async function issueCertificate({ studentId, courseId, enrollmentId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(courseId, "course ID");
  validateObjectId(enrollmentId, "enrollment ID");

  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: studentId,
    course: courseId,
  })
    .populate({
      path: "student",
      select: "fullName email",
    })
    .populate({
      path: "course",
      select: "title instructor totalLectures",
      populate: {
        path: "instructor",
        select: "fullName",
      },
    });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  if (enrollment.status !== "completed") {
    throw new ApiError(
      400,
      "Course must be completed before issuing certificate",
    );
  }

  if ((enrollment.progressPercentage ?? 0) < 100) {
    throw new ApiError(400, "100% course progress is required for certificate");
  }

  /*
   * Certificate already present hai to duplicate
   * certificate create nahi karenge.
   */
  const existingCertificate = await Certificate.findOne({
    student: studentId,
    course: courseId,
  });

  if (existingCertificate) {
    await markCertificateIssued({
      enrollmentId: enrollment._id,
    });

    try {
      await dispatchNotification({
        userId: enrollment.student._id,

        title: "Certificate issued",

        message: `Your certificate for "${enrollment.course.title}" is now available.`,

        type: "certificate",

        resourceType: "certificate",

        resourceId: existingCertificate._id,

        courseId: enrollment.course._id,

        actionUrl: `${process.env.FRONTEND_URL || ""}/certificates`,

        metadata: {
          certificateNumber: existingCertificate.certificateNumber,

          verificationCode: existingCertificate.verificationCode,
        },
      });
    } catch (error) {
      console.error("Certificate notification failed:", error);
    }

    return {
      certificate: existingCertificate,
      created: false,
      message: "Certificate has already been issued",
    };
  }

  /*
   * Har real issue attempt track hoga.
   */
  await markCertificateIssuePending(enrollment._id);

  try {
    let certificateNumber;
    let verificationCode;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const generatedCertificateNumber = generateCertificateNumber();

      const generatedVerificationCode = generateVerificationCode();

      const duplicate = await Certificate.exists({
        $or: [
          {
            certificateNumber: generatedCertificateNumber,
          },
          {
            verificationCode: generatedVerificationCode,
          },
        ],
      });

      if (!duplicate) {
        certificateNumber = generatedCertificateNumber;

        verificationCode = generatedVerificationCode;

        break;
      }
    }

    if (!certificateNumber || !verificationCode) {
      throw new ApiError(500, "Unable to generate unique certificate details");
    }

    const issuedAt = new Date();

    const completedAt =
      enrollment.completedAt ?? enrollment.updatedAt ?? issuedAt;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const verificationUrl = `${frontendUrl}/certificates/verify/${verificationCode}`;

    const pdfBuffer = await generateCertificatePdf({
      certificateNumber,

      studentName: enrollment.student.fullName,

      courseTitle: enrollment.course.title,

      instructorName: enrollment.course.instructor?.fullName || "",

      completedAt,
      issuedAt,
      verificationCode,
      verificationUrl,
    });

    const { certificateUrl, certificateFileId } = await uploadCertificatePdf({
      pdfBuffer,
      certificateNumber,
    });

    const certificate = await Certificate.create({
      certificateNumber,

      student: enrollment.student._id,

      course: enrollment.course._id,

      enrollment: enrollment._id,

      studentName: enrollment.student.fullName,

      courseTitle: enrollment.course.title,

      instructorName: enrollment.course.instructor?.fullName || "",

      completionPercentage: enrollment.progressPercentage,

      completedAt,
      issuedAt,

      certificateUrl,
      certificateFileId,

      verificationCode,

      status: "issued",
    });

    await markCertificateIssued({
      enrollmentId: enrollment._id,
    });

    try {
      await dispatchNotification({
        userId: enrollment.student._id,
        title: "Certificate issued",
        message: `Your certificate for "${enrollment.course.title}" is now available.`,
        type: "certificate",
        resourceType: "certificate",
        resourceId: certificate._id,
        courseId: enrollment.course._id,
        actionUrl: `${process.env.FRONTEND_URL || ""}/certificates`,
        metadata: {
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
        },
      });
    } catch (error) {
      console.error("Certificate notification failed:", error);
    }

    return {
      certificate,
      created: true,
      message: "Certificate issued successfully",
    };
  } catch (error) {
    /*
     * Concurrent request ke case me certificate
     * kisi aur request ne create kar diya ho sakta hai.
     */
    if (error?.code === 11000) {
      const existingCertificate = await Certificate.findOne({
        student: studentId,
        course: courseId,
      });

      if (existingCertificate) {
        await markCertificateIssued({
          enrollmentId: enrollment._id,
        });

        return {
          certificate: existingCertificate,

          created: false,

          message: "Certificate has already been issued",
        };
      }
    }

    await markCertificateIssueFailed({
      enrollmentId: enrollment._id,
      error,
    });

    throw error;
  }
}
export async function getMyCertificates(studentId) {
  validateObjectId(studentId, "student ID");

  const certificates = await Certificate.find({
    student: studentId,
  })
    .select(
      `
      certificateNumber
      student
      course
      enrollment
      studentName
      courseTitle
      instructorName
      completionPercentage
      completedAt
      issuedAt
      certificateUrl
      verificationCode
      status
      revokedAt
      revocationReason
      createdAt
      updatedAt
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .sort({
      issuedAt: -1,
      createdAt: -1,
    })
    .lean();

  return certificates;
}

export async function getCertificateById({ certificateId, studentId }) {
  validateObjectId(certificateId, "certificate ID");
  validateObjectId(studentId, "student ID");

  const certificate = await Certificate.findOne({
    _id: certificateId,
    student: studentId,
  })
    .populate({
      path: "course",
      select: `
        title
        slug
        thumbnailUrl
        instructor
      `,
      populate: {
        path: "instructor",
        select: "fullName avatarUrl",
      },
    })
    .populate({
      path: "student",
      select: "fullName email avatarUrl",
    })
    .lean();

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  return certificate;
}

export async function verifyCertificate(verificationCode) {
  const rawCode = String(verificationCode || "").trim();

  if (!rawCode) {
    throw new ApiError(400, "Verification code is required");
  }

  const queryConditions = [
    { verificationCode: rawCode.toLowerCase() },
    { verificationCode: rawCode },
    { certificateNumber: rawCode.toUpperCase() },
    { certificateNumber: rawCode },
  ];

  if (mongoose.Types.ObjectId.isValid(rawCode)) {
    queryConditions.push({ _id: rawCode });
  }

  const certificate = await Certificate.findOne({
    $or: queryConditions,
  })
    .select(
      `
      certificateNumber
      studentName
      courseTitle
      instructorName
      completionPercentage
      completedAt
      issuedAt
      verificationCode
      status
      revokedAt
      revocationReason
      certificateUrl
    `,
    )
    .lean();

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  return {
    valid: certificate.status === "issued",
    certificate,
  };
}

export async function getAdminCertificates(query = {}) {
  const {
    search,
    status,
    student,
    course,
    sortBy = "issuedAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const searchFilter = buildSearchFilter(search, [
    "certificateNumber",
    "studentName",
    "courseTitle",
    "instructorName",
    "verificationCode",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (student) {
    validateObjectId(student, "student ID");
    filter.student = student;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["issued", "revoked"],
    "Certificate status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "issuedAt",
      "completedAt",
      "createdAt",
      "updatedAt",
      "studentName",
      "courseTitle",
    ],
    defaultField: "issuedAt",
    defaultOrder: "desc",
  });

  const [certificates, totalRecords] = await Promise.all([
    Certificate.find(filter)
      .select(
        `
          certificateNumber
          student
          course
          enrollment
          studentName
          courseTitle
          instructorName
          completionPercentage
          completedAt
          issuedAt
          certificateUrl
          certificateFileId
          verificationCode
          status
          revokedAt
          revokedBy
          revocationReason
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "course",
        select: "title slug thumbnailUrl status isPublished isActive",
      })
      .populate({
        path: "revokedBy",
        select: "fullName email avatarUrl role",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Certificate.countDocuments(filter),
  ]);

  return {
    certificates,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      status: parsedStatus ?? null,
      student: student || null,
      course: course || null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function revokeCertificate({
  certificateId,
  revokedBy,
  revocationReason,
}) {
  validateObjectId(certificateId, "certificate ID");

  validateObjectId(revokedBy, "admin ID");

  validateRequired(revocationReason?.trim(), "Revocation reason");

  const certificate = await Certificate.findById(certificateId);

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  const before = {
    status: certificate.status,
    revokedAt: certificate.revokedAt,
    revokedBy: certificate.revokedBy,
    revocationReason: certificate.revocationReason,
  };

  if (certificate.status === "revoked") {
    return {
      certificate,
      before,
      after: before,
      changed: false,
      message: "Certificate is already revoked",
    };
  }

  certificate.status = "revoked";
  certificate.revokedAt = new Date();
  certificate.revokedBy = revokedBy;
  certificate.revocationReason = revocationReason.trim();

  await certificate.save();

  const after = {
    status: certificate.status,
    revokedAt: certificate.revokedAt,
    revokedBy: certificate.revokedBy,
    revocationReason: certificate.revocationReason,
  };

  return {
    certificate,
    before,
    after,
    changed: true,
    message: "Certificate revoked successfully",
  };
}

export async function restoreCertificate(certificateId) {
  validateObjectId(certificateId, "certificate ID");

  const certificate = await Certificate.findById(certificateId);

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  const before = {
    status: certificate.status,
    revokedAt: certificate.revokedAt,
    revokedBy: certificate.revokedBy,
    revocationReason: certificate.revocationReason,
  };

  if (certificate.status === "issued") {
    return {
      certificate,
      before,
      after: before,
      changed: false,
      message: "Certificate is already active",
    };
  }

  certificate.status = "issued";
  certificate.revokedAt = null;
  certificate.revokedBy = null;
  certificate.revocationReason = "";

  await certificate.save();

  const after = {
    status: certificate.status,
    revokedAt: certificate.revokedAt,
    revokedBy: certificate.revokedBy,
    revocationReason: certificate.revocationReason,
  };

  return {
    certificate,
    before,
    after,
    changed: true,
    message: "Certificate restored successfully",
  };
}

export async function markCertificateIssued({ enrollmentId }) {
  validateObjectId(enrollmentId, "enrollment ID");

  return Enrollment.findByIdAndUpdate(
    enrollmentId,
    {
      $set: {
        certificateStatus: "issued",
        certificateIssuedAt: new Date(),
        certificateIssueError: "",
      },
    },
    {
      returnDocument: 'after',
    },
  );
}

export async function markCertificateIssueFailed({ enrollmentId, error }) {
  validateObjectId(enrollmentId, "enrollment ID");

  const errorMessage =
    error instanceof Error
      ? error.message
      : String(error || "Unknown certificate generation error");

  return Enrollment.findByIdAndUpdate(
    enrollmentId,
    {
      $set: {
        certificateStatus: "failed",

        certificateIssueError: errorMessage.slice(0, 1000),
      },
    },
    {
      returnDocument: 'after',
    },
  );
}

async function markCertificateIssuePending(enrollmentId) {
  validateObjectId(enrollmentId, "enrollment ID");

  return Enrollment.findByIdAndUpdate(
    enrollmentId,
    {
      $set: {
        certificateStatus: "pending",
        certificateIssueError: "",
      },

      $inc: {
        certificateIssueAttempts: 1,
      },
    },
    {
      returnDocument: 'after',
    },
  );
}

export async function retryCertificateIssue(enrollmentId) {
  validateObjectId(enrollmentId, "enrollment ID");

  const enrollment = await Enrollment.findById(enrollmentId)
    .select(
      `
        student
        course
        status
        progressPercentage
        certificateStatus
        certificateIssueAttempts
        certificateIssueError
      `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  if (
    enrollment.status !== "completed" ||
    (enrollment.progressPercentage ?? 0) < 100
  ) {
    throw new ApiError(400, "Enrollment is not eligible for certificate");
  }

  if (enrollment.certificateStatus === "issued") {
    const certificate = await Certificate.findOne({
      student: enrollment.student,
      course: enrollment.course,
    });

    if (certificate) {
      return {
        certificate,
        created: false,
        message: "Certificate has already been issued",
      };
    }
  }

  return issueCertificate({
    studentId: enrollment.student,
    courseId: enrollment.course,
    enrollmentId: enrollment._id,
  });
}

export async function getCertificateIssueQueue(query = {}) {
  const { search, status, sortBy = "updatedAt", order = "desc" } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    status: "completed",
    progressPercentage: 100,
    certificateStatus: {
      $in: ["pending", "failed"],
    },
  };

  const parsedCertificateStatus = parseEnumQuery(
    status,
    ["pending", "failed"],
    "Certificate issue status",
  );

  if (parsedCertificateStatus !== undefined) {
    filter.certificateStatus = parsedCertificateStatus;
  }

  /*
   * Student name/email aur course title Enrollment
   * document me direct stored nahi hain.
   *
   * Isliye search ke liye matching students aur
   * courses pehle find karenge.
   */
  if (search?.trim()) {
    const searchText = search.trim();

    const studentSearchFilter = buildSearchFilter(searchText, [
      "fullName",
      "email",
    ]);

    const courseSearchFilter = buildSearchFilter(searchText, ["title", "slug"]);

    const [students, courses] = await Promise.all([
      User.find({
        role: "student",
        $or: studentSearchFilter,
      })
        .select("_id")
        .lean(),

      Course.find({
        $or: courseSearchFilter,
      })
        .select("_id")
        .lean(),
    ]);

    const studentIds = students.map((student) => student._id);

    const courseIds = courses.map((course) => course._id);

    filter.$or = [
      {
        student: {
          $in: studentIds,
        },
      },
      {
        course: {
          $in: courseIds,
        },
      },
    ];
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "completedAt",
      "certificateIssuedAt",
      "certificateIssueAttempts",
      "createdAt",
      "updatedAt",
    ],
    defaultField: "updatedAt",
    defaultOrder: "desc",
  });

  const [enrollments, totalRecords] = await Promise.all([
    Enrollment.find(filter)
      .select(
        `
          student
          course
          status
          progressPercentage
          completedLecturesCount
          completedAt
          certificateStatus
          certificateIssuedAt
          certificateIssueError
          certificateIssueAttempts
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "course",
        select:
          "title slug thumbnailUrl instructor status isPublished isActive",
        populate: {
          path: "instructor",
          select: "fullName email avatarUrl",
        },
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Enrollment.countDocuments(filter),
  ]);

  const queue = enrollments.map((enrollment) => ({
    ...enrollment,

    canRetry:
      enrollment.status === "completed" &&
      enrollment.progressPercentage >= 100 &&
      ["pending", "failed"].includes(enrollment.certificateStatus),

    hasError: Boolean(enrollment.certificateIssueError),
  }));

  return {
    queue,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,

      status: parsedCertificateStatus ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

export async function bulkRetryCertificateIssues(enrollmentIds) {
  let idsToProcess = enrollmentIds;

  if (!Array.isArray(idsToProcess) || idsToProcess.length === 0) {
    const queue = await Enrollment.find({
      status: "completed",
      progressPercentage: { $gte: 100 },
      certificateStatus: { $in: ["pending", "failed"] },
    })
      .limit(20)
      .select("_id")
      .lean();

    idsToProcess = queue.map((e) => e._id.toString());
  }

  if (idsToProcess.length === 0) {
    return {
      summary: {
        requested: 0,
        eligible: 0,
        successful: 0,
        failed: 0,
        newlyCreated: 0,
        alreadyExisting: 0,
      },
      results: [],
      message: "No pending or failed certificate issuances found in queue",
    };
  }

  if (idsToProcess.length > 20) {
    idsToProcess = idsToProcess.slice(0, 20);
  }

  const uniqueEnrollmentIds = [
    ...new Set(idsToProcess.map((id) => String(id).trim())),
  ];

  for (const enrollmentId of uniqueEnrollmentIds) {
    validateObjectId(enrollmentId, "enrollment ID");
  }

  const objectIds = uniqueEnrollmentIds.map(
    (enrollmentId) => new mongoose.Types.ObjectId(enrollmentId),
  );

  /*
   * Sirf eligible pending/failed enrollments fetch honge.
   */
  const eligibleEnrollments = await Enrollment.find({
    _id: {
      $in: objectIds,
    },

    status: "completed",

    progressPercentage: {
      $gte: 100,
    },

    certificateStatus: {
      $in: ["pending", "failed"],
    },
  })
    .select(
      `
        student
        course
        status
        progressPercentage
        certificateStatus
        certificateIssueAttempts
        certificateIssueError
      `,
    )
    .lean();

  const eligibleEnrollmentMap = new Map(
    eligibleEnrollments.map((enrollment) => [
      enrollment._id.toString(),
      enrollment,
    ]),
  );

  const results = [];

  /*
   * Sequential processing intentionally use kar rahe hain.
   *
   * Isse ek saath bahut saare PDF generation aur uploads
   * run nahi honge.
   */
  for (const enrollmentId of uniqueEnrollmentIds) {
    const enrollment = eligibleEnrollmentMap.get(enrollmentId);

    if (!enrollment) {
      results.push({
        enrollmentId,
        success: false,
        created: false,
        certificate: null,
        error:
          "Enrollment is missing, already issued, or not eligible for retry",
      });

      continue;
    }

    try {
      const result = await issueCertificate({
        studentId: enrollment.student,
        courseId: enrollment.course,
        enrollmentId: enrollment._id,
      });

      results.push({
        enrollmentId,
        success: true,
        created: result.created,
        certificate: result.certificate,
        message: result.message,
        error: null,
      });
    } catch (error) {
      results.push({
        enrollmentId,
        success: false,
        created: false,
        certificate: null,
        error:
          error instanceof Error ? error.message : "Certificate retry failed",
      });
    }
  }

  const successfulRetries = results.filter((item) => item.success);

  const failedRetries = results.filter((item) => !item.success);

  const newlyCreatedCertificates = successfulRetries.filter(
    (item) => item.created,
  );

  return {
    summary: {
      requested: uniqueEnrollmentIds.length,

      eligible: eligibleEnrollments.length,

      successful: successfulRetries.length,

      failed: failedRetries.length,

      newlyCreated: newlyCreatedCertificates.length,

      alreadyExisting:
        successfulRetries.length - newlyCreatedCertificates.length,
    },

    results,
  };
}

export async function getCertificateDownload({
  certificateId,
  requesterId,
  requesterRole,
}) {
  validateObjectId(certificateId, "certificate ID");

  validateObjectId(requesterId, "requester ID");

  const filter = {
    _id: certificateId,
  };

  /*
   * Admin kisi bhi certificate ko access kar sakta hai.
   * Student sirf apna certificate access karega.
   */
  if (requesterRole !== "admin") {
    filter.student = requesterId;
  }

  const certificate = await Certificate.findOne(filter)
    .select(
      `
      certificateNumber
      student
      course
      studentName
      courseTitle
      instructorName
      completionPercentage
      completedAt
      certificateUrl
      certificateFileId
      verificationCode
      status
      revokedAt
      revocationReason
      issuedAt
    `,
    )
    .populate({
      path: "course",
      select: "instructor title",
      populate: {
        path: "instructor",
        select: "fullName",
      },
    })
    .lean();

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  if (certificate.status === "revoked") {
    throw new ApiError(403, "Revoked certificate cannot be downloaded");
  }

  const resolvedInstructorName =
    certificate.instructorName && certificate.instructorName.trim() !== ""
      ? certificate.instructorName.trim()
      : certificate.course?.instructor?.fullName || "VertexPortal Academic Board";

  return {
    certificateId: certificate._id,
    certificateNumber: certificate.certificateNumber,
    studentName: certificate.studentName,
    courseTitle: certificate.courseTitle,
    instructorName: resolvedInstructorName,
    completedAt: certificate.completedAt || certificate.issuedAt,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    downloadUrl: certificate.certificateUrl,
  };
}

export async function regenerateCertificatePdf(certificateId) {
  validateObjectId(certificateId, "certificate ID");

  const certificate = await Certificate.findById(certificateId);

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  if (certificate.status === "revoked") {
    throw new ApiError(400, "Revoked certificate PDF cannot be regenerated");
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const verificationUrl = `${frontendUrl}/certificates/verify/${certificate.verificationCode}`;

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber: certificate.certificateNumber,

    studentName: certificate.studentName,

    courseTitle: certificate.courseTitle,

    instructorName: certificate.instructorName,

    completedAt: certificate.completedAt,

    issuedAt: certificate.issuedAt,

    verificationCode: certificate.verificationCode,

    verificationUrl,
  });

  const uploadResult = await uploadCertificatePdf({
    pdfBuffer,
    certificateNumber: certificate.certificateNumber,
  });

  certificate.certificateUrl = uploadResult.certificateUrl;

  certificate.certificateFileId = uploadResult.certificateFileId;

  await certificate.save();

  return {
    certificate,
    message: "Certificate PDF regenerated successfully",
  };
}
