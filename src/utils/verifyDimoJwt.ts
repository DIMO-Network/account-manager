import type { JWTPayload } from 'jose';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.DIMO_JWKS_URL!));
const ISSUER = process.env.DIMO_JWT_ISSUER!;

export type DimoJwtPayload = JWTPayload & {
  email?: string;
  ethereum_address?: string;
  [key: string]: any;
};

export async function verifyDimoJwt(token: string): Promise<DimoJwtPayload> {
  try {
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
