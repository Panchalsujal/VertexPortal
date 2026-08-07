import mongoose from "mongoose";

import { ApiError } from "./ApiError.js";



export function validateObjectId(
  value,
  fieldName = "ID",
) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`,
    );
  }

  return value;
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
