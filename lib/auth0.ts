// lib/auth0.ts (Edge-safe, minimal verifier using jose)
import { jwtVerify } from 'jose';
import { createRemoteJWKSet } from 'jose';
import { Auth0Client } from "@auth0/nextjs-auth0/server";
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const ISSUER = `https://${AUTH0_DOMAIN}/`;

// if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
//   throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set');
// }

const JWKS = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`));

export async function verifyAuth0Token(token: string) {
  // throws on invalid token
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUTH0_AUDIENCE,
  });

  // payload is the decoded JWT claims
  return payload;
}

/**
 * Minimal getSession for middleware:
 * - Accepts Bearer token from Authorization header.
 * - Returns { user: { sub, email, name } } or null.
 */
export const auth0 = new Auth0Client({
  // Options are loaded from environment variables by default
  // Ensure necessary environment variables are properly set
  // domain: process.env.AUTH0_DOMAIN,
  // clientId: process.env.AUTH0_CLIENT_ID,
  // clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // appBaseUrl: process.env.APP_BASE_URL,
  // secret: process.env.AUTH0_SECRET,

  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables for API authorized applications are no longer automatically picked up by the SDK.
    // Instead, we need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  }
});
export async function getSessionFromRequest(request: Request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;

  const token = auth.split(' ')[1];
  try {
    const payload = await verifyAuth0Token(token);
    return {
      user: {
        sub: (payload as any).sub,
        email: (payload as any).email,
        name: (payload as any).name,
      },
      claims: payload,
    };
  } catch (err) {
    // invalid token
    return null;
  }
}
