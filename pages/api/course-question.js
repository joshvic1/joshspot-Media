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
        "The course covers TikTok, Facebook and Instagram ads, plus online store setup. Once your payment is confirmed, you can join the Telegram channels here and send the links to your email.",
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
              "You are Joshspot Media's helpful course assistant. Answer questions about a ₦8,000 course that teaches TikTok ads, Facebook ads, Instagram ads, and online store creation. Keep answers short, practical, honest, and beginner-friendly. Let people know that once their payment is confirmed, they will see buttons to join the TikTok and Facebook & Instagram Telegram channels immediately, with an optional form above the buttons to send both course links to their email. Do not guarantee sales or income.",
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
        "The course covers TikTok, Facebook, Instagram ads and online store setup in a beginner-friendly way. Once your payment is confirmed, you can join the course Telegram channels immediately and optionally send both links to your email.",
    });
  } catch (error) {
    console.log("COURSE QUESTION API ERROR:", error);
    return res.status(500).json({
      message: "I could not answer that right now. Please try again.",
    });
  }
}
