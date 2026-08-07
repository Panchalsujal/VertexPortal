export function escapeRegex(value = "") {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

export function buildSearchFilter(
  search,
  fields = [],
) {
  if (
    !search?.trim() ||
    !Array.isArray(fields) ||
    fields.length === 0
  ) {
    return null;
  }

  const escapedSearchText = escapeRegex(
    search.trim(),
  );

  return fields.map((field) => ({
    [field]: {
      $regex: escapedSearchText,
      $options: "i",
    },
  }));
}