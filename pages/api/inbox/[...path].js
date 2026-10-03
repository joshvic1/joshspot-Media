// Same-origin proxy keeps deployment configuration and customer requests together.
export const config = { api: { bodyParser: { sizeLimit: '8mb' }, responseLimit: '25mb' } };
export default async function handler(req, res) {
  if (!['GET', 'POST', 'PUT'].includes(req.method)) return res.status(405).end();
  const path = req.query.path;
  if (!Array.isArray(path) || path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)) || ['webhook', 'events'].includes(path[0])) return res.status(404).end();
  const base = (process.env.BACKEND_API_URL || 'https://joshspot-media-backend-production.up.railway.app/api').replace(/\/$/, '');
  const url = new URL(`${base}/inbox/${path.join('/')}`);
  for (const [key, value] of Object.entries(req.query)) if (key !== 'path' && typeof value === 'string') url.searchParams.set(key, value);
  try {
    const response = await fetch(url, { method: req.method, headers: { Authorization: req.headers.authorization || '', 'Content-Type': 'application/json' }, ...(req.method !== 'GET' ? { body: JSON.stringify(req.body) } : {}), signal: AbortSignal.timeout(30000) });
    res.status(response.status);
    for (const header of ['content-type', 'content-disposition', 'x-content-type-options']) if (response.headers.has(header)) res.setHeader(header, response.headers.get(header));
    res.setHeader('Cache-Control', 'private, no-store');
    if (path[0] === 'events-ticket' && response.ok) {
      const result = await response.json();
      return res.json({ url: `${base}/inbox/events?ticket=${encodeURIComponent(result.ticket)}` });
    }
    return res.send(Buffer.from(await response.arrayBuffer()));
  } catch { return res.status(502).json({ message: 'Cannot reach the inbox service. Please try again.' }); }
}
