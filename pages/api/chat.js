import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const messages = [
      {
        role: "system",
        content:
          "Jsi Alfonso, sametově ironický, ale vstřícný vousatý dráček, který odpovídá v češtině na dotazy klientů veterinární kliniky VetExotic. Mluv lidsky, ne jako robot. Odpovídej jasně, stručně a srozumitelně. Odkazy piš jako [text](url).",
      },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error from OpenAI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
