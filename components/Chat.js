import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

// Convert URLs in text to clickable links
function formatMessage(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Format ISO timestamp to HH:mm
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("chatHistory");
      const lastActive = localStorage.getItem("chatLastActive");
      if (saved && lastActive) {
        const lastActiveTime = parseInt(lastActive, 10);
        if (Date.now() - lastActiveTime < EXPIRATION_TIME) {
          return JSON.parse(saved);
        }
      }
    } catch {}
    return [
      {
        role: "assistant",
        content:
          "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomohu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
        time: new Date().toISOString(),
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom when messages/typing change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, typingText, loading]);

  // Save history and timestamp on change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem("chatLastActive", Date.now().toString());
  }, [chatHistory]);

  // Animate typing of assistant's text
  function animateTyping(fullText) {
    return new Promise((resolve) => {
      let i = 0;
      if (typingTimeoutRef.current) clearInterval(typingTimeoutRef.current);
      typingTimeoutRef.current = setInterval(() => {
        i++;
        setTypingText(fullText.substring(0, i));
        if (i >= fullText.length) {
          clearInterval(typingTimeoutRef.current);
          resolve();
        }
      }, 20);
    });
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim(), time: new Date().toISOString() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInput("");
    setLoading(true);
    setTypingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history: newHistory }),
      });
      const data = await res.json();

      if (res.ok) {
        const assistantMessage = { role: "assistant", content: data.reply, time: new Date().toISOString() };
        await animateTyping(data.reply);
        setChatHistory((prev) => [...prev, assistantMessage]);
        setTypingText("");
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Chyba: " + data.error, time: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Chyba připojení: " + error.message, time: new Date().toISOString() },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatBox} aria-live="polite">
        {chatHistory.map((msg, i) => {
          const isUser = msg.role === "user";
          const displayContent =
            !isUser && i === chatHistory.length - 1 && typingText ? typingText : msg.content;
          return (
            <div key={i} className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
              <div className={styles.bubble}>
                {formatMessage(displayContent)}
                {msg.time && <span className={styles.time}>{formatTime(msg.time)}</span>}
              </div>
            </div>
          );
        })}
        {loading && !typingText && (
          <div className={styles.typingIndicator}>Alfonso píše...</div>
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
          aria-label="Zadej svou zprávu"
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Odeslat zprávu">
          {loading ? "Odesílám..." : "Odeslat"}
        </button>
      </form>
    </div>
);
}
