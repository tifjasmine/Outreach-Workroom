import { createHmac, timingSafeEqual } from 'node:crypto';

function signature(value) {
  const secret = process.env.WORKROOM_SESSION_SECRET;
  if (!secret) throw new Error('WORKROOM_SESSION_SECRET is not configured');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSession(member) {
  const payload = Buffer.from(JSON.stringify({ member, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifySession(event) {
  const token = String(event.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature) return null;
  const expected = signature(payload);
  const a = Buffer.from(suppliedSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.expires > Date.now() && ['Tiffany', 'Xachil'].includes(data.member) ? data : null;
  } catch {
    return null;
  }
}

export function matchesPasscode(member, value) {
  const configured = member === 'Tiffany'
    ? process.env.WORKROOM_TIFFANY_PASSCODE
    : member === 'Xachil'
      ? process.env.WORKROOM_XACHIL_PASSCODE
      : '';
  const expected = Buffer.from(configured || '');
  const supplied = Buffer.from(String(value || ''));
  return expected.length > 0 && expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
