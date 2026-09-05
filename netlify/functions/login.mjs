import { createSession, matchesPasscode } from './lib/auth.mjs';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const { member, passcode } = JSON.parse(event.body || '{}');
    if (!['Tiffany', 'Xachil'].includes(member) || !matchesPasscode(member, passcode)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'That name or passcode is not correct.' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ token: createSession(member), member }) };
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Could not sign in.' }) };
  }
}
