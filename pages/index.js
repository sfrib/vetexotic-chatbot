import React, { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (res.ok) {
        setResponse(data.reply);
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (e) {
      setResponse("Fetch error: " + e.message);
    }
    setLoading(false);
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
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Odesílám..." : "Odeslat"}
        </button>
      </form>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{response}</pre>
    </div>
  );
}
