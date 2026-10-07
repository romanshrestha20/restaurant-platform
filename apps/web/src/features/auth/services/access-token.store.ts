let accessToken: string | null = null;
const clearListeners = new Set<() => void>();

export const accessTokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
    clearListeners.forEach((listener) => listener());
  },
  /** Subscribe to explicit session clears, including unrecoverable API 401s. */
  onClear(listener: () => void): () => void {
    clearListeners.add(listener);
    return () => clearListeners.delete(listener);
  },
};
