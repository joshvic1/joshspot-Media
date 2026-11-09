import { detectBrowser } from "../../utils/courseAttribution";
const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://joshspot-media-backend-production.up.railway.app/api";

const COURSE_PRICE = 8000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") {
      const name = String(req.body?.name || "").trim();
      const whatsapp = String(req.body?.whatsapp || "").trim();
      const email = String(req.body?.email || "").trim();

      if (!name || !whatsapp || !email) {
        return res.status(400).json({
          message: "Please enter your name, WhatsApp number and email address.",
        });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });

      const response = await fetch(`${BACKEND_URL}/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: req.body?.product === "whatsapp-course" ? 10000 : COURSE_PRICE,
          customerName: name,
          customerPhone: whatsapp,
          customerEmail: email,
          product: req.body?.product === "whatsapp-course" ? "whatsapp-course" : "ads-course",
          attribution: {
            source: req.body?.attribution?.source,
            sourceLabel: req.body?.attribution?.sourceLabel,
            method: req.body?.attribution?.method,
            browser: detectBrowser(String(req.headers["user-agent"] || "")),
          },
          note: `Course purchase - WhatsApp: ${whatsapp}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res
          .status(response.status)
          .json({ message: data.message || "Unable to create payment account" });
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
        return res
          .status(response.status)
          .json({ message: data.message || "Unable to fetch payment status" });
      }

      return res.status(200).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.log("COURSE INVOICE API ERROR:", error);
    return res.status(500).json({ message: "Unable to process payment." });
  }
}
