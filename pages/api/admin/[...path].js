const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://joshspot-media-backend-production.up.railway.app/api";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const path = (req.query.path || []).join("/");
  if (!/^course-payments(?:\/[a-f\d]{24}\/(?:check|remind))?$/.test(path)) return res.status(404).end();
  const method = path === "course-payments" ? "GET" : "POST";
  if (req.method !== method) { res.setHeader("Allow", method); return res.status(405).end(); }
  if (!req.headers.authorization) return res.status(401).json({ message: "Please sign in to continue." });
  const query = new URLSearchParams();
  for (const key of ["page", "search", "status"]) if (typeof req.query[key] === "string") query.set(key, req.query[key]);
  try {
    const response = await fetch(`${BACKEND_URL}/admin/${path}?${query}`, {
      method, headers: { authorization: req.headers.authorization, "Content-Type": "application/json" },
      ...(method === "POST" ? { body: "{}" } : {}),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch { return res.status(502).json({ message: "Unable to reach the admin service. Please try again." }); }
}
