// pages/index.js
import React, { useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful VetExotic assistant." },
          { role: "user", content: input },
        ],
      });
      setResponse(completion.choices[0].message.content);
    } catch (error) {
      setResponse("Error: " + error.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>VetExotic Chatbot</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={5}
          style={{ width: "100%" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napište svůj dotaz..."
        />
        <button type="submit">Odeslat</button>
      </form>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{response}</pre>
    </div>
  );
}
