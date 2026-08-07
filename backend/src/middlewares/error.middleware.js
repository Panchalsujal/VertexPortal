export const errorHandler = (
  error,
  req,
  res,
  next,
) => {
  console.error("Global error:", error);

  let statusCode = error.statusCode || 500;
  let message =
    error.message || "Internal server error";
  let errors = error.errors || [];

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    statusCode = 400;

    errors = Object.values(error.errors).map(
      (item) => item.message,
    );

    message = "Validation failed";
  }

  // MongoDB duplicate key
  if (error.code === 11000) {
    statusCode = 409;

    const duplicateField =
      Object.keys(error.keyValue || {})[0];

    message = duplicateField
      ? `${duplicateField} already exists`
      : "Duplicate resource";
  }

  // Invalid JWT
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  // Expired JWT
  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV !== "production" && {
      stack: error.stack,
    }),
  });
};