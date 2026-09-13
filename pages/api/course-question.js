export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const question = String(req.body?.question || "").trim();

  if (!question) {
    return res.status(400).json({ message: "Please type your question." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer:
        "I can answer this once the OPENAI_API_KEY is added to the frontend environment. For now, you can ask on WhatsApp before payment.",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are Joshspot Media's helpful course assistant. Answer questions about a ₦8,000 course that teaches TikTok ads, Facebook ads, Instagram ads, and online store creation. Keep answers short, practical, honest, and beginner-friendly. Let people know that once their payment is confirmed, they will be redirected to WhatsApp and get access to the course immediately on WhatsApp. Do not guarantee sales or income.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI COURSE QUESTION ERROR:", data);
      return res.status(500).json({
        message: "I could not answer that right now. Please try again.",
      });
    }

    const answer =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .map((item) => item.text || "")
        .join("")
        .trim();

    return res.status(200).json({
      answer:
        answer ||
        "The course covers TikTok, Facebook, Instagram ads and online store setup in a beginner-friendly way. Once your payment is confirmed, you will get access immediately on WhatsApp.",
    });
  } catch (error) {
    console.log("COURSE QUESTION API ERROR:", error);
    return res.status(500).json({
      message: "I could not answer that right now. Please try again.",
    });
  }
}
