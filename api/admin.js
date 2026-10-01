import { list } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

function authed(req) {
  const pw = process.env.ADMIN_PASSWORD || '';
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)gfa=([^;]+)/);
  return pw && m && decodeURIComponent(m[1]) === pw;
}

export default async function handler(req, res) {
  const pw = process.env.ADMIN_PASSWORD || '';
  if (req.method === 'POST') {
    const body = req.body || {};
    if (pw && body.password === pw) {
      res.setHeader('Set-Cookie', `gfa=${encodeURIComponent(pw)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: 'wrong password' });
  }
  if (!authed(req)) return res.status(401).json({ error: 'login' });
  try {
    const out = [];
    let cursor;
    do {
      const r = await list({ prefix: 'apps/', limit: 1000, cursor });
      for (const b of r.blobs) {
        const resp = await fetch(b.url, { cache: 'no-store' });
        if (resp.ok) out.push(await resp.json());
      }
      cursor = r.cursor;
    } while (cursor);
    out.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return res.status(200).json({ apps: out });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
