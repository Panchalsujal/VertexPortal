export function getRequestMetadata(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  let ipAddress = null;

  if (typeof forwardedFor === "string") {
    ipAddress = forwardedFor.split(",")[0]?.trim() || null;
  } else {
    ipAddress = req.ip || req.socket?.remoteAddress || null;
  }

  const userAgent = req.get("user-agent") || null;

  return {
    ipAddress,
    userAgent,
  };
}
