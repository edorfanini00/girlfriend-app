import { put } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    if (!b.name || typeof b.pct !== 'number') return res.status(400).json({ error: 'bad payload' });
    const ts = new Date().toISOString();
    const safe = String(b.name).slice(0, 40).replace(/[^\w\- ]/g, '_');
    const rec = {
      ts, name: String(b.name).slice(0, 60), pct: b.pct, tier: b.tier, pts: b.pts, notes: b.notes || [],
      log: Array.isArray(b.log) ? b.log.slice(0, 80) : [], seconds: b.seconds, ua: String(b.ua || '').slice(0, 200),
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
    };
    const key = `apps/${ts.replace(/[:.]/g, '-')}_${safe}.json`;
    await put(key, JSON.stringify(rec), { access: 'public', contentType: 'application/json', addRandomSuffix: false });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
