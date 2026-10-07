import { createOriginPolicy } from './origin-policy';

describe('createOriginPolicy', () => {
  const production = createOriginPolicy({
    clientUrl: 'https://yourplatform.com',
    platformDomain: 'yourplatform.com',
    customDomains: 'pizzahouse.fi, www.burgers.example ,',
    isProduction: true,
  });

  it('allows the client URL and platform storefront subdomains', () => {
    expect(production('https://yourplatform.com')).toBe(true);
    expect(production('https://pizza-house.yourplatform.com')).toBe(true);
    expect(production('https://PIZZA-HOUSE.yourplatform.com')).toBe(true);
  });

  it('allows verified custom domains with or without www', () => {
    expect(production('https://pizzahouse.fi')).toBe(true);
    expect(production('https://www.pizzahouse.fi')).toBe(true);
    expect(production('https://burgers.example')).toBe(true);
  });

  it('rejects foreign, look-alike, opaque and insecure origins', () => {
    for (const origin of [
      'https://evil.example',
      'https://yourplatform.com.evil.example',
      'https://evilyourplatform.com',
      'https://order.pizzahouse.fi',
      'http://pizza-house.yourplatform.com',
      'null',
      'not a url',
    ]) {
      expect(production(origin)).toBe(false);
    }
  });

  it('allows local storefront subdomains outside production only', () => {
    const options = { clientUrl: 'http://localhost:3000' };
    const development = createOriginPolicy({ ...options, isProduction: false });
    expect(development('http://localhost:3000')).toBe(true);
    expect(development('http://127.0.0.1:3000')).toBe(true);
    expect(development('http://pizza-house.localhost:3000')).toBe(true);

    const prod = createOriginPolicy({ ...options, isProduction: true });
    expect(prod('http://localhost:3000')).toBe(true);
    expect(prod('http://pizza-house.localhost:3000')).toBe(false);
  });

  it('rejects an invalid client URL at startup', () => {
    expect(() =>
      createOriginPolicy({ clientUrl: 'nope', isProduction: true }),
    ).toThrow('CLIENT_URL must contain a valid origin');
  });
});
