const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://joshspot-media-backend-production.up.railway.app/api";

const SCRIPT_PRICE = 20000;

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const name = String(req.body?.name || "").trim();
      const whatsapp = String(req.body?.whatsapp || "").trim();
      const businessName = String(req.body?.businessName || "").trim();

      if (!name || !whatsapp) {
        return res.status(400).json({
          message: "Please enter your name and WhatsApp number.",
        });
      }

      const response = await fetch(`${BACKEND_URL}/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: SCRIPT_PRICE,
          customerName: name,
          note: `Video script purchase - WhatsApp: ${whatsapp}${
            businessName ? ` - Business: ${businessName}` : ""
          }`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          message: data.message || "Unable to create payment account",
        });
      }

      return res.status(201).json(data);
    }

    if (req.method === "GET") {
      const token = String(req.query?.token || "").trim();

      if (!token) {
        return res.status(400).json({ message: "Missing invoice token." });
      }

      const response = await fetch(`${BACKEND_URL}/invoice/${token}`);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          message: data.message || "Unable to fetch payment status",
        });
      }

      return res.status(200).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.log("SCRIPT INVOICE API ERROR:", error);
    return res.status(500).json({ message: "Unable to process payment." });
  }
}
