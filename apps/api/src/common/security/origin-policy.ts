export interface OriginPolicyOptions {
  /** The primary web client URL; always allowed. */
  clientUrl: string;
  /** Platform apex domain; it and all of its subdomains are storefronts. */
  platformDomain?: string;
  /** Comma-separated verified custom storefront hostnames. */
  customDomains?: string;
  isProduction: boolean;
}

export type OriginPolicy = (origin: string) => boolean;

const normalizeOrigin = (value: string): URL | null => {
  try {
    const url = new URL(value);
    return url.origin === 'null' ? null : url;
  } catch {
    return null;
  }
};

const normalizeHostname = (hostname: string): string => {
  const host = hostname.trim().toLowerCase();
  return host.startsWith('www.') ? host.slice(4) : host;
};

/**
 * Decides which browser origins may call the API. Storefronts are served from
 * platform subdomains and verified custom domains, so a single CLIENT_URL is
 * not enough. Used by CORS, the same-origin CSRF check and Socket.IO.
 */
export const createOriginPolicy = ({
  clientUrl,
  platformDomain,
  customDomains = '',
  isProduction,
}: OriginPolicyOptions): OriginPolicy => {
  const client = normalizeOrigin(clientUrl);
  if (!client) {
    throw new Error('CLIENT_URL must contain a valid origin');
  }

  const exactOrigins = new Set([client.origin]);
  if (client.hostname === 'localhost') {
    exactOrigins.add(client.origin.replace('localhost', '127.0.0.1'));
  }

  const platformDomains = new Set<string>();
  if (platformDomain) platformDomains.add(normalizeHostname(platformDomain));
  // Local storefronts run on subdomains of the client host, e.g. pizza-house.localhost.
  if (!isProduction) platformDomains.add(normalizeHostname(client.hostname));

  const customHosts = new Set(
    customDomains.split(',').map(normalizeHostname).filter(Boolean),
  );

  return (origin: string): boolean => {
    const url = normalizeOrigin(origin);
    if (!url) return false;
    if (exactOrigins.has(url.origin)) return true;
    if (isProduction && url.protocol !== 'https:') return false;
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

    const host = normalizeHostname(url.hostname);
    if (customHosts.has(host)) return true;
    for (const domain of platformDomains) {
      if (host === domain || host.endsWith(`.${domain}`)) return true;
    }
    return false;
  };
};
