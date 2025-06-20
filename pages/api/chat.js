import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

function formatMessage(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      const cleanUrl = part.replace(/[)\]\}.,!?]+$/, ""); // Odstraň koncové znaky
      return (
        <a key={i} href={cleanUrl} target="_blank" rel="noopener noreferrer">
          {cleanUrl}
        </a>
      );
    } else {
      return <span key={i}>{part}</span>;
    }
  });
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    const stored = localStorage.getItem("chatHistory");
    const storedTime = localStorage.getItem("chatTimestamp");
    if (stored && storedTime && Date.now() - storedTime < 30 * 60 * 1000) {
      return JSON.parse(stored);
    }
    return [
      {
        role: "assistant",
        content:
          "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomůžu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
        timestamp: Date.now(),
      },
    ];
  });

  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem("chatTimestamp", Date.now());
  }, [chatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, typingText]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    const newHistory = [...chatHistory, newMessage];
    setChatHistory(newHistory);
    setInput("");
    setLoading(true);
    setTypingText("");

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
        await animateTyping(data.reply);
        setChatHistory([
          ...newHistory,
          {
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        ]);
        setTypingText("");
      } else {
        setChatHistory([
          ...newHistory,
          {
            role: "assistant",
            content: "Chyba: " + data.error,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (e) {
      setChatHistory([
        ...newHistory,
        {
          role: "assistant",
          content: "Chyba připojení: " + e.message,
          timestamp: Date.now(),
        },
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
            <div className={styles.bubble}>
              {formatMessage(msg.content)}
              <div className={styles.timestamp}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && typingText && (
          <div className={styles.message + " " + styles.assistant}>
            <div className={styles.bubble}>
              {formatMessage(typingText)}
              <div className={styles.timestamp}>
                {formatTime(Date.now())}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napiš dotaz sem…"
          disabled={loading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={styles.button}
        >
          Poslat
        </button>
      </form>
    </div>
  );
}
