export interface DomainResolution {
  type: 'tenant' | 'platform_discovery' | 'unknown';
  slug?: string;
  hostname: string;
  isCustomDomain?: boolean;
}

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'admin',
  'api',
  'mail',
  'staging',
  'dev',
  'test',
  'status',
  'auth',
]);

const PLATFORM_DOMAINS = [
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'yourplatform.com',
  'localhost',
  '127.0.0.1',
  'nip.io',
  'lvh.me',
];

/**
 * Normalizes an incoming hostname string by stripping port, lowercasing,
 * and removing leading 'www.'.
 */
export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return 'localhost';
  let host = rawHost.toLowerCase().trim();
  // Strip port
  if (host.includes(':')) {
    host = host.split(':')[0]!;
  }
  // Strip www. prefix
  if (host.startsWith('www.')) {
    host = host.slice(4);
  }
  return host;
}

/**
 * Resolves an incoming hostname to either a specific restaurant tenant slug,
 * platform discovery mode, or unknown/unsupported domain.
 */
export function resolveDomain(
  rawHost: string | null | undefined,
  overrideSlug?: string | null,
): DomainResolution {
  // If an explicit override/param is provided (e.g. in local dev), use it
  if (overrideSlug) {
    return {
      type: 'tenant',
      slug: overrideSlug.toLowerCase().trim(),
      hostname: normalizeHostname(rawHost),
      isCustomDomain: false,
    };
  }

  const hostname = normalizeHostname(rawHost);

  // Check if matches apex localhost or platform domain -> Platform Discovery
  for (const platformDomain of PLATFORM_DOMAINS) {
    if (hostname === platformDomain) {
      return {
        type: 'platform_discovery',
        hostname,
        isCustomDomain: false,
      };
    }
  }

  // Check for platform subdomains (e.g., pizza-house.localhost or pizza-house.yourplatform.com)
  for (const platformDomain of PLATFORM_DOMAINS) {
    if (hostname.endsWith(`.${platformDomain}`)) {
      const prefix = hostname.slice(0, -(platformDomain.length + 1));
      const parts = prefix.split('.');
      const candidateSlug = parts[parts.length - 1];

      if (!candidateSlug || RESERVED_SUBDOMAINS.has(candidateSlug)) {
        return {
          type: 'platform_discovery',
          hostname,
          isCustomDomain: false,
        };
      }

      return {
        type: 'tenant',
        slug: candidateSlug,
        hostname,
        isCustomDomain: false,
      };
    }
  }

  // If none of the platform domains matched, treat as potential custom domain.
  // In the current phase (platform subdomains first), if it's a domain with a single name or not recognized:
  return {
    type: 'tenant',
    slug: hostname.split('.')[0] || hostname,
    hostname,
    isCustomDomain: true,
  };
}
