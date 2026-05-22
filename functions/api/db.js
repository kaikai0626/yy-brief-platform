const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const key = url.searchParams.get('key');
    if (!key) return json({ error: 'key required' }, 400);
    const row = await env.DB.prepare('SELECT value FROM store WHERE key = ?').bind(key).first();
    return json({ value: row ? row.value : null });
  }

  if (request.method === 'POST') {
    const { key, value } = await request.json();
    if (!key) return json({ error: 'key required' }, 400);
    await env.DB.prepare("INSERT INTO store (key,value,updated_at) VALUES (?,?,strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key, value).run();
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
