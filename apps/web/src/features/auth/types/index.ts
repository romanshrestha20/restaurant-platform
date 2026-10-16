/**
 * The shape returned by GET /auth/me and embedded in login/register/refresh
 * session responses. Matches the API AccessAuthUser and AuthUserResponse shapes.
 */
export type AuthUser = {
  id: string;
  email: string;
  /** Flat role name strings extracted from the API roles array. */
  roles: string[];
};

/**
 * Shape returned in the JSON body of POST /auth/login, /auth/register,
 * and POST /auth/refresh.
 *
 * The refreshToken is set as an httpOnly cookie by the API and is NOT
 * present in this body.
 *
 * NOTE: The API embeds AuthUserResponse (with nested roles array) in the
 * session body, but the controller serialises it via setRefreshCookie which
 * returns { user, accessToken }. The roles field shape from the API body is
 * Array<{ role: { name: string } }>, so we normalise it into AuthUser on
 * receipt (see auth-provider).
 */
export type AuthSessionResponse = {
  user: AuthSessionUser;
  accessToken: string;
};

/**
 * Raw user shape embedded in login/register/refresh API response bodies.
 * Roles are nested objects; normalise to AuthUser before storing in context.
 */
export type AuthSessionUser = {
  id: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

/** Normalise the nested-roles shape from the API body into a flat AuthUser. */
export function normalizeSessionUser(raw: AuthSessionUser): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    roles: raw.roles.map((r) => r.role.name),
  };
}
