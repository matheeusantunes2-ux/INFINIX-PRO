import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const ACCESS_TTL_SECONDS = 15 * 60;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = (await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

export function signAccessToken(payload: { sub: string; companyId: string; role: string }) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_ACCESS_SECRET deve ter pelo menos 32 caracteres.');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + ACCESS_TTL_SECONDS }));
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token: string): { sub: string; companyId: string; role: string } | null {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) return null;
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest();
    const received = Buffer.from(signature, 'base64url');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp <= Math.floor(Date.now() / 1000)) return null;
    if (typeof data.sub !== 'string' || typeof data.companyId !== 'string' || typeof data.role !== 'string') return null;
    return { sub: data.sub, companyId: data.companyId, role: data.role };
  } catch { return null; }
}
