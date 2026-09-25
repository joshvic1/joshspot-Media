// Match the backend used by the invoice generator (utils/api.js).
const BACKEND_URL = "https://joshspot-media-backend-production.up.railway.app/api";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({message:"Method not allowed"});
  }
  const token = req.query.token;
  if (typeof token !== "string" || !token.trim()) return res.status(400).json({message:"Missing invoice token."});
  try {
    const response = await fetch(`${BACKEND_URL}/invoice/${encodeURIComponent(token.trim())}`, {
      headers:{Accept:"application/json"}, signal:AbortSignal.timeout(20000),
    });
    if (response.status === 404) return res.status(404).json({message:"Invoice not found. Please check the payment link."});
    if (!response.ok) return res.status(502).json({message:"The invoice service is temporarily unavailable. Please retry."});
    const data = await response.json();
    if (data?.token !== token.trim() || !Number.isFinite(Number(data.amount)) || !data.status) {
      return res.status(502).json({message:"The invoice service returned an incomplete response. Please retry."});
    }
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({message:"We could not reach the invoice service. Please retry in a moment."});
  }
}
