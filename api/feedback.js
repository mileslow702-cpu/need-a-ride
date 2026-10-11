// Stores tester feedback (Vercel Blob storage), one file per message.
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Storage is not connected yet' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const text = String(body.text || '').trim().slice(0, 1500);
  if (!text) return res.status(400).json({ error: 'Empty feedback' });
  const email = String(body.email || 'anonymous').trim().toLowerCase().slice(0, 120);
  const rec = { email, text, stats: body.stats || {}, at: new Date().toISOString() };
  const path = 'feedback/' + Date.now() + '-' + email.replace(/[^a-z0-9@._-]/g, '_') + '.json';
  for (const access of ['private', 'public']) {
    try { await put(path, JSON.stringify(rec, null, 2), { access, addRandomSuffix: true, contentType: 'application/json' }); return res.status(200).json({ ok: true }); } catch (e) { /* try the other access mode */ }
  }
  return res.status(500).json({ error: 'Could not save' });
}
