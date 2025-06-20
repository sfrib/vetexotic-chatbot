import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minut

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
      if (saved && lastActive && Date.now() - +lastActive < EXPIRATION_TIME) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        role: "assistant",
        content:
          "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomohu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. 😊",
        time: new Date().toISOString(),
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // automatický scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, typingText, loading]);

  // ukládání do localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem("chatLastActive", Date.now().toString());
  }, [chatHistory]);

  // animace psaní
  function animateTyping(fullText) {
    return new Promise((resolve) => {
      let i = 0;
      clearInterval(typingTimeoutRef.current);
      typingTimeoutRef.current = setInterval(() => {
        i++;
        setTypingText(fullText.slice(0, i));
        if (i >= fullText.length) {
          clearInterval(typingTimeoutRef.current);
          resolve();
        }
      }, 20);
    });
  }

  // odeslání
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim(), time: new Date().toISOString() };
    const newHist = [...chatHistory, userMsg];
    setChatHistory(newHist);
    setInput("");
    setLoading(true);
    setTypingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: newHist }),
      });
      const data = await res.json();
      if (res.ok) {
        const assistMsg = { role: "assistant", content: data.reply, time: new Date().toISOString() };
        await animateTyping(data.reply);
        setChatHistory((prev) => [...prev, assistMsg]);
        setTypingText("");
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Chyba: " + data.error, time: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Chyba připojení: " + err.message, time: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatBox} aria-live="polite">
        {chatHistory.map((msg, i) => {
          const isUser = msg.role === "user";
          const content = !isUser && i === chatHistory.length - 1 && typingText ? typingText : msg.content;
          return (
            <div key={i} className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
              <div className={styles.bubble}>{formatMessage(content)}</div>
              {/* timestamp pod bublinou */}
              {msg.time && <div className={styles.time}>{formatTime(msg.time)}</div>}
            </div>
          );
        })}
        {loading && !typingText && <div className={styles.typingIndicator}>Alfonso píše...</div>}
        <div ref={chatEndRef} />
      </div>
      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napište zprávu…"
          disabled={loading}
          aria-label="Zadejte zprávu"
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Odeslat">
          📨
        </button>
      </form>
    </div>
  );
}
