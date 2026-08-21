/**
 * Returns the canonical site base URL, sourced from BETTER_AUTH_URL env var.
 * Falls back to http://localhost:3000 for local development.
 *
 * CommonJS version — usable by playwright.config.ts and other
 * config files that run outside the Next.js module resolver.
 */
function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

module.exports = { getSiteUrl };
