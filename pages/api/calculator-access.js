import { verifyCalculatorAccess } from "../../utils/calculatorAccess.mjs";
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://joshspot-media-backend-production.up.railway.app/api";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
  try {
    const status = await verifyCalculatorAccess(req.headers.authorization, BACKEND_URL);
    return res.status(status).json({ allowed: status === 200 });
  } catch { return res.status(502).json({ allowed: false }); }
}
