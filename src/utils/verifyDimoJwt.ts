import type { JWTPayload } from 'jose';
import { createRemoteJWKSet, jwtVerify } from 'jose';

function getJWKS() {
  const jwksUrl = process.env.DIMO_JWKS_URL;
  if (!jwksUrl) {
    throw new Error('DIMO_JWKS_URL environment variable is not set');
  }
  return createRemoteJWKSet(new URL(jwksUrl));
}

function getIssuer() {
  const issuer = process.env.DIMO_JWT_ISSUER;
  if (!issuer) {
    throw new Error('DIMO_JWT_ISSUER environment variable is not set');
  }
  return issuer;
}

export type DimoJwtPayload = JWTPayload & {
  email?: string;
  ethereum_address?: string;
  [key: string]: any;
};

export async function verifyDimoJwt(token: string): Promise<DimoJwtPayload> {
  try {
    const JWKS = getJWKS();
    const ISSUER = getIssuer();

    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
      issuer: ISSUER,
    });
    if (!payload) {
      throw new Error('No payload in JWT');
    }
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token has expired');
    }
    return payload as DimoJwtPayload;
  } catch (err) {
    throw new Error(`Invalid DIMO JWT: ${err instanceof Error ? err.message : String(err)}`);
  }
}
