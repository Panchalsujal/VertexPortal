export function getPagination(query = {}) {
  const page = Math.max(
    Number.parseInt(query.page, 10) || 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(query.limit, 10) || 10,
      1,
    ),
    100,
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

export function buildPaginationMeta({
  page,
  limit,
  totalRecords,
}) {
  const totalPages = Math.ceil(
    totalRecords / limit,
  );

  return {
    currentPage: page,
    limit,
    totalRecords,
    totalPages,

    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,

    nextPage:
      page < totalPages
        ? page + 1
        : null,

    previousPage:
      page > 1
        ? page - 1
        : null,
  };
}