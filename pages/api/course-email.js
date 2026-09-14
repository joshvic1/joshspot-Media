const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://joshspot-media-backend-production.up.railway.app/api";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }
  const token = String(req.body?.token || "").trim();
  if (!token) return res.status(400).json({ message: "Missing invoice token." });
  try {
    const response = await fetch(`${BACKEND_URL}/invoice/${encodeURIComponent(token)}/course-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: req.body?.email }),
    });
    return res.status(response.status).json(await response.json());
  } catch {
    return res.status(502).json({ message: "The email did not send. Please try again, or join the Telegram channels below." });
  }
}
