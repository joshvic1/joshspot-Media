export const config = { api: { bodyParser: { sizeLimit: '10mb' }, responseLimit: '20mb' } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const path = (req.query.path || []).join('/');
  const session = path === 'session';
  const collection = /^(clients|ads-clients|verification-clients)$/.test(path);
  const record = /^(clients|ads-clients|verification-clients)\/[a-f\d]{24}$/.test(path);
  const attachment = /^verification-clients\/[a-f\d]{24}\/id-card$/.test(path);
  if (!session && !collection && !record && !attachment) return res.status(404).end();
  const methods = session || attachment ? ['GET'] : collection ? ['GET', 'POST'] : ['PUT', 'DELETE'];
  if (!methods.includes(req.method)) { res.setHeader('Allow', methods.join(', ')); return res.status(405).end(); }
  if (!req.headers.authorization) return res.status(401).json({ message: 'Please sign in to continue.' });
  const base = (process.env.BACKEND_API_URL || 'https://joshspot-media-backend-production.up.railway.app/api').replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/crm/${path}`, {
      method: req.method, headers: { authorization: req.headers.authorization, 'Content-Type': 'application/json' },
      ...(['POST', 'PUT'].includes(req.method) ? { body: JSON.stringify(req.body) } : {}), signal: AbortSignal.timeout(30000),
    });
    for (const header of ['content-type', 'content-disposition']) if (response.headers.has(header)) res.setHeader(header, response.headers.get(header));
    return res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch { return res.status(502).json({ message: 'Unable to reach the CRM service. Please try again.' }); }
}
