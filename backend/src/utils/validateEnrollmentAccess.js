export function validateEnrollmentAccess(
  enrollment,
) {
  if (enrollment.status === "cancelled") {
    const error = new Error(
      "Your enrollment has been cancelled",
    );

    error.statusCode = 403;
    throw error;
  }

  const hasExpired =
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <=
      Date.now();

  if (
    enrollment.status === "expired" ||
    hasExpired
  ) {
    const error = new Error(
      "Your enrollment has expired",
    );

    error.statusCode = 403;
    throw error;
  }
}