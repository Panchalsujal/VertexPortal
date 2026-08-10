import { ApiError } from "./ApiError.js";

export function parseBooleanQuery(
  value,
  fieldName = "Value",
) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = String(
    value,
  ).toLowerCase();

  if (
    !["true", "false"].includes(
      normalizedValue,
    )
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be true or false`,
    );
  }

  return normalizedValue === "true";
}

export function parseEnumQuery(
  value,
  allowedValues = [],
  fieldName = "Value",
) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  if (normalizedValue === "") {
    return undefined;
  }

  if (
    !allowedValues.includes(
      normalizedValue,
    )
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    );
  }

  return normalizedValue;
}

export function parseSortQuery({sortBy,order,allowedFields = [], defaultField = "createdAt",
  defaultOrder = "desc",
}) {
  const selectedSortField =
    allowedFields.includes(sortBy)
      ? sortBy
      : defaultField;

  const normalizedOrder = String(
    order || defaultOrder,
  ).toLowerCase();

  const sortOrder =
    normalizedOrder === "asc"
      ? 1
      : -1;

  return {
    sortBy: selectedSortField,
    sortOrder,
    order:
      sortOrder === 1
        ? "asc"
        : "desc",
  };
}

export function parseDateRange({
  from,
  to,
  fieldName = "Date",
}) {
  if (!from && !to) {
    return undefined;
  }

  const dateFilter = {};

  if (from) {
    const fromDate = new Date(from);

    if (
      Number.isNaN(
        fromDate.getTime(),
      )
    ) {
      throw new ApiError(
        400,
        `Invalid ${fieldName} from date`,
      );
    }

    fromDate.setHours(0, 0, 0, 0);

    dateFilter.$gte = fromDate;
  }

  if (to) {
    const toDate = new Date(to);

    if (
      Number.isNaN(
        toDate.getTime(),
      )
    ) {
      throw new ApiError(
        400,
        `Invalid ${fieldName} to date`,
      );
    }

    toDate.setHours(
      23,
      59,
      59,
      999,
    );

    dateFilter.$lte = toDate;
  }

  if (
    dateFilter.$gte &&
    dateFilter.$lte &&
    dateFilter.$gte >
      dateFilter.$lte
  ) {
    throw new ApiError(
      400,
      `${fieldName} from date cannot be after to date`,
    );
  }

  return dateFilter;
}

export function parseNumberQuery(
  value,
  {
    fieldName = "Value",
    min = null,
    max = null,
    integer = false,
  } = {},
) {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new ApiError(
      400,
      `${fieldName} must be a valid number`,
    );
  }

  if (
    integer &&
    !Number.isInteger(parsedValue)
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be an integer`,
    );
  }

  if (
    min !== null &&
    parsedValue < min
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be at least ${min}`,
    );
  }

  if (
    max !== null &&
    parsedValue > max
  ) {
    throw new ApiError(
      400,
      `${fieldName} must not exceed ${max}`,
    );
  }

  return parsedValue;
}

export function parseNumberRange({
  min,
  max,
  fieldName = "Value",
  minimumAllowed = null,
  maximumAllowed = null,
}) {
  if (
    min === undefined &&
    max === undefined
  ) {
    return undefined;
  }

  const range = {};

  if (min !== undefined) {
    range.$gte = parseNumberQuery(
      min,
      {
        fieldName: `Minimum ${fieldName}`,
        min: minimumAllowed,
        max: maximumAllowed,
      },
    );
  }

  if (max !== undefined) {
    range.$lte = parseNumberQuery(
      max,
      {
        fieldName: `Maximum ${fieldName}`,
        min: minimumAllowed,
        max: maximumAllowed,
      },
    );
  }

  if (
    range.$gte !== undefined &&
    range.$lte !== undefined &&
    range.$gte > range.$lte
  ) {
    throw new ApiError(
      400,
      `Minimum ${fieldName} cannot be greater than maximum ${fieldName}`,
    );
  }

  return range;
}