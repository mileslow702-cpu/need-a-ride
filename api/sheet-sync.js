// One-time (and safe to repeat) copy of every saved player onto the North Star sheet's Arcade tab.
// Open https://need-a-ride.vercel.app/api/sheet-sync once after the sheet script is updated. Re-running only refreshes rows.
import { list, get } from '@vercel/blob';

const ARCADE = 'https://northstargame.vercel.app/api/arcade';

async function read(pathname) {
  for (const access of ['private', 'public']) {
    try {
      const r = await get(pathname, { access, useCache: false });
      if (r) return JSON.parse(await new Response(r.stream).text());
    } catch (e) { /* try the other access mode */ }
  }
  return null;
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Storage is not connected yet' });
  const paths = [];
  let cursor;
  do {
    const page = await list({ prefix: 'players/', cursor, limit: 1000 });
    paths.push(...page.blobs.map(b => b.pathname)); cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const players = [];
  for (let i = 0; i < paths.length; i += 20) {   // read 20 at a time
    const got = await Promise.all(paths.slice(i, i + 20).map(read));
    for (const d of got) if (d && d.email) players.push({
      game: 'need-a-ride', email: d.email, visits: d.sessions || 1, minutes: d.playMin || 0, firstSeen: d.firstSeen, lastSeen: d.t || d.firstSeen,
      progress: `${d.rides || 0} rides · $${Math.round(d.career || 0).toLocaleString('en-US')} career`,
    });
  }
  let saved = 0, failed = 0;
  for (let i = 0; i < players.length; i += 200) {
    const r = await fetch(ARCADE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: players.slice(i, i + 200) }) }).catch(() => null);
    if (r && r.ok) saved += Math.min(200, players.length - i); else failed += Math.min(200, players.length - i);
  }
  return res.status(failed ? 503 : 200).json({ players: players.length, saved, failed,
    note: failed ? 'The sheet did not confirm. Make sure the new sheet script is deployed, then open this page again.' : 'All players are on the sheet.' });
}
