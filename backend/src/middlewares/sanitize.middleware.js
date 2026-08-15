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
 * Middleware to sanitize req.body, req.query, and req.params against NoSQL injection.
 * Uses Object.defineProperty to support Express 5 getter-only properties on req.
 */
export const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = cleanNoSqlInjection(req.body);
    }

    if (req.query && typeof req.query === "object") {
      const sanitizedQuery = cleanNoSqlInjection(req.query);
      Object.defineProperty(req, "query", {
        value: sanitizedQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (req.params && typeof req.params === "object") {
      const sanitizedParams = cleanNoSqlInjection(req.params);
      try {
        req.params = sanitizedParams;
      } catch {
        Object.defineProperty(req, "params", {
          value: sanitizedParams,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  } catch (err) {
    console.error("Sanitize input warning:", err);
  }

  next();
};
