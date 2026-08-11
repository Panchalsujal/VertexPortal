import mongoose from "mongoose";

import { ApiError } from "./ApiError.js";



export function validateObjectId(
  value,
  fieldName = "ID",
) {
  if (!value) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`,
    );
  }

  const rawId =
    typeof value === "object" && value !== null
      ? value._id || value.id || value
      : value;

  const idStr = String(rawId);

  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`,
    );
  }

  return idStr;
}

export function validateRequired(
  value,
  fieldName = "Value",
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new ApiError(
      400,
      `${fieldName} is required`,
    );
  }

  return value;
}

export function validateBooleanBody(
  value,
  fieldName = "Value",
) {
  if (typeof value !== "boolean") {
    throw new ApiError(
      400,
      `${fieldName} must be true or false`,
    );
  }

  return value;
}

export function validateEnumValue(
  value,
  allowedValues = [],
  fieldName = "Value",
) {
  validateRequired(value, fieldName);

  if (!allowedValues.includes(value)) {
    throw new ApiError(
      400,
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    );
  }

  return value;
}
