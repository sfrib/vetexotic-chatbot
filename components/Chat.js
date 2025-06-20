import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css"; // přidej stylopis, nebo uprav podle potřeby

function formatMessage(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    } else {
      return <span key={i}>{part}</span>;
    }
  });
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content:
        "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomůžu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    const newHistory = [...chatHistory, newMessage];

    setChatHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: newHistory,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory([...newHistory, { role: "assistant", content: data.reply }]);
      } else {
        setChatHistory([
          ...newHistory,
          { role: "assistant", content: "Chyba: " + data.error },
        ]);
      }
    } catch (e) {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: "Chyba připojení: " + e.message },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatBox}>
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${
              msg.role === "user" ? styles.user : styles.assistant
            }`}
          >
            <div className={styles.bubble}>{formatMessage(msg.content)}</div>
          </div>
        ))}
        {loading && (
          <div className={styles.message + " " + styles.assistant}>
            <div className={styles.bubble}>...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napiš svůj dotaz…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Odeslat
        </button>
      </form>
    </div>
  );
}
