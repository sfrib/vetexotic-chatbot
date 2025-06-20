import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content:
        "Ahoj! Jsem Alfonso – virtuální asistent kliniky VetExotic. Pomůžu ti najít info o ordinační době, cenách nebo pohotovosti. Napiš mi, s čím ti mohu pomoci. 😊",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage = { role: "user", content: input };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: [...chatHistory, newUserMessage],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "❌ Chyba: " + data.error },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Chyba spojení: " + err.message },
      ]);
    }

    setLoading(false);
  }

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
            <div className={styles.bubble}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className={styles.message + " " + styles.assistant}>
            <div className={styles.bubbleTyping}>
              Alfonso píše<span className={styles.dot}>.</span>
              <span className={styles.dot}>.</span>
              <span className={styles.dot}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <textarea
          className={styles.input}
          placeholder="Napiš svůj dotaz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={2}
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Odesílám..." : "Odeslat"}
        </button>
      </form>
    </div>
  );
}
