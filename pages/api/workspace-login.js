export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const { email, password, admin } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return res.status(400).json({ message: 'Enter your email and password.' });
  const base = (process.env.BACKEND_API_URL || 'https://joshspot-media-backend-production.up.railway.app/api').replace(/\/$/, '');
  try {
    const signIn = (kind) => fetch(`${base}/${kind}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }), signal: AbortSignal.timeout(15000),
    });
    let accountType = admin === true ? 'admin' : 'staff';
    let response = await signIn(accountType === 'admin' ? 'admin' : 'crm');
    // Inbox uses both existing account types. Only a successful backend password check grants access.
    if (!admin && response.status === 401) {
      accountType = 'admin';
      response = await signIn('admin');
    }
    const data = await response.json();
    return res.status(response.status).json(response.ok ? { ...data, accountType } : data);
  } catch { return res.status(502).json({ message: 'Unable to reach the sign-in service. Please try again.' }); }
}
