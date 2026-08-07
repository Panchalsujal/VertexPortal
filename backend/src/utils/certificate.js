import { randomBytes } from "node:crypto";

/*
 * Example:
 * CERT-2026-A8F3C921
 */
export function generateCertificateNumber() {
  const year = new Date().getFullYear();

  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `CERT-${year}-${randomPart}`;
}

/*
 * Public verification URL me use hoga.
 * Example:
 * 1f7a8c6b4d2e...
 */
export function generateVerificationCode() {
  return randomBytes(24).toString("hex");
}