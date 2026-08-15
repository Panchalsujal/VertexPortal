/**
 * Recursively cleans object keys starting with '$' or containing '.'
 * to prevent MongoDB NoSQL Injection attacks.
 */
function cleanNoSqlInjection(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => cleanNoSqlInjection(item));
  }

  if (
    typeof data === "object" &&
    !(data instanceof Date) &&
    !(data instanceof RegExp) &&
    !Buffer.isBuffer(data)
  ) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize keys starting with '$' or containing '.'
      if (key.startsWith("$") || key.includes(".")) {
        const safeKey = key.replace(/^\$+/, "").replace(/\./g, "_");
        if (safeKey) {
          cleaned[safeKey] = cleanNoSqlInjection(value);
        }
      } else {
        cleaned[key] = cleanNoSqlInjection(value);
      }
    }
    return cleaned;
  }

  return data;
}

/**
 * Middleware to sanitize req.body, req.query, and req.params against NoSQL injection
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = cleanNoSqlInjection(req.body);
  }

  if (req.query) {
    req.query = cleanNoSqlInjection(req.query);
  }

  if (req.params) {
    req.params = cleanNoSqlInjection(req.params);
  }

  next();
};
