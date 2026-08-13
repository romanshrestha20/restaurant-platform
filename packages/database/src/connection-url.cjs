const LEGACY_STRICT_SSL_MODES = new Set(['prefer', 'require', 'verify-ca']);

/**
 * Preserve pg v8's strict certificate verification explicitly so upgrading to
 * pg v9 cannot silently weaken an existing connection string.
 */
const normalizePostgresSslMode = (connectionString) =>
  connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/,
    (match, separator, sslMode) =>
      LEGACY_STRICT_SSL_MODES.has(sslMode)
        ? `${separator}sslmode=verify-full`
        : match,
  );

module.exports = { normalizePostgresSslMode };
