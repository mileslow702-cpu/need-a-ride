// Saves and loads a player's progress by email (Vercel Blob storage).
import { put, get } from '@vercel/blob';

const clean = e => String(e || '').trim().toLowerCase();
const valid = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length < 120;
const pathFor = e => 'players/' + e.replace(/[^a-z0-9@._-]/g, '_') + '.json';

async function read(path) {
  for (const access of ['private', 'public']) {
    try {
      const r = await get(path, { access, useCache: false });
      if (r) return JSON.parse(await new Response(r.stream).text());
    } catch (e) { /* try the other access mode */ }
  }
  return null;
}
async function write(path, obj) {
  let last;
  for (const access of ['private', 'public']) {
    try {
      await put(path, JSON.stringify(obj), { access, allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 });
      return;
    } catch (e) { last = e; }
  }
  throw last;
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Storage is not connected yet' });
  try {
    if (req.method === 'GET') {
      const email = clean(req.query.email);
      if (!valid(email)) return res.status(400).json({ error: 'Bad email' });
      return res.status(200).json({ data: await read(pathFor(email)) });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const email = clean(body.email), data = body.data;
      if (!valid(email) || !data || typeof data !== 'object' || JSON.stringify(data).length > 4000) return res.status(400).json({ error: 'Bad save' });
      const prev = await read(pathFor(email));
      if (data.isNew && prev) return res.status(200).json({ ok: true });
      await write(pathFor(email), { ...data, email, firstSeen: (prev && prev.firstSeen) || Date.now() });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Save failed' });
  }
}
