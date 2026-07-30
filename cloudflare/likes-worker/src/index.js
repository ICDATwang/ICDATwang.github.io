const ALLOWED_ORIGINS = new Set([
  'https://icdatwang.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: getCorsHeaders(origin),
  });
}

function isValidPageKey(value) {
  return typeof value === 'string' && /^[a-z0-9-]{1,64}$/.test(value);
}

function isValidVisitorId(value) {
  return typeof value === 'string'
    && /^[a-f0-9-]{36}$/i.test(value);
}

async function getLikeState(database, pageKey, visitorId) {
  const statements = [
    database
      .prepare('SELECT COUNT(*) AS count FROM likes WHERE page_key = ?1')
      .bind(pageKey),
  ];

  if (visitorId) {
    statements.push(
      database
        .prepare('SELECT 1 AS liked FROM likes WHERE page_key = ?1 AND visitor_id = ?2 LIMIT 1')
        .bind(pageKey, visitorId),
    );
  }

  const results = await database.batch(statements);
  const count = Number(results[0]?.results?.[0]?.count ?? 0);
  const liked = visitorId
    ? results[1]?.results?.length > 0
    : false;

  return { count, liked };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return json({ error: 'Origin not allowed.' }, 403, origin);
      }

      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'Origin not allowed.' }, 403, origin);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'weiwang-homepage-likes' }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/likes') {
      const pageKey = url.searchParams.get('page') || 'homepage';
      const visitorId = url.searchParams.get('visitor') || '';

      if (!isValidPageKey(pageKey) || (visitorId && !isValidVisitorId(visitorId))) {
        return json({ error: 'Invalid request parameters.' }, 400, origin);
      }

      const state = await getLikeState(env.DB, pageKey, visitorId || null);
      return json(state, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/likes') {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: 'Request body must be valid JSON.' }, 400, origin);
      }

      const pageKey = body.page || 'homepage';
      const visitorId = body.visitorId;
      const liked = body.liked;

      if (!isValidPageKey(pageKey) || !isValidVisitorId(visitorId) || typeof liked !== 'boolean') {
        return json({ error: 'Invalid like request.' }, 400, origin);
      }

      if (liked) {
        await env.DB
          .prepare('INSERT OR IGNORE INTO likes (page_key, visitor_id) VALUES (?1, ?2)')
          .bind(pageKey, visitorId)
          .run();
      } else {
        await env.DB
          .prepare('DELETE FROM likes WHERE page_key = ?1 AND visitor_id = ?2')
          .bind(pageKey, visitorId)
          .run();
      }

      const state = await getLikeState(env.DB, pageKey, visitorId);
      return json(state, 200, origin);
    }

    return json({ error: 'Not found.' }, 404, origin);
  },
};
