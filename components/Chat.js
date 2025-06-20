import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

function formatMessage(text) {
  // Rozpoznání URL a obalení do klikatelného odkazu bez závorek na konci
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Pomocná funkce pro formátování času HH:mm
function formatTime(date) {
  return date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STORAGE_KEY = "vetexotic_chat_history";
const TIMEOUT_MINUTES = 30;

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // Načtení historie z localStorage, respektive timeout
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = new Date();
        const lastTimestamp = new Date(parsed.timestamp);
        const diffMinutes = (now - lastTimestamp) / 1000 / 60;

        if (diffMinutes < TIMEOUT_MINUTES) {
          setChatHistory(parsed.history);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setChatHistory([
            {
              role: "assistant",
              content:
                "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomůžu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setChatHistory([
          {
            role: "assistant",
            content:
              "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomůžu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // pokud chyba v localStorage, nastav výchozí zprávu
      setChatHistory([
        {
          role: "assistant",
          content:
            "Ahoj! 🦎 Jsem Alfonso, virtuální asistent kliniky VetExotic. Pomůžu ti s informacemi o otevírací době, objednání, pohotovosti nebo orientačních cenách. Pokud je situace akutní, napiš mi hned, a nasměruji tě správným směrem. 😊",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Uložení historie do localStorage při změně
  useEffect(() => {
    if (chatHistory.length === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ history: chatHistory, timestamp: new Date().toISOString() })
    );
  }, [chatHistory]);

  // Scroll na konec chatu
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, typingText, loading]);

  // Animace psaní
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
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
          history: newHistory.filter((m) => m.role !== "assistant").map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Animace odpovědi
        await animateTyping(data.reply);
        setChatHistory((h) => [
          ...h,
          { role: "assistant", content: data.reply, timestamp: new Date().toISOString() },
        ]);
        setTypingText("");
      } else {
        setChatHistory((h) => [
          ...h,
          { role: "assistant", content: "Chyba: " + data.error, timestamp: new Date().toISOString() },
        ]);
      }
    } catch (e) {
      setChatHistory((h) => [
        ...h,
        { role: "assistant", content: "Chyba připojení: " + e.message, timestamp: new Date().toISOString() },
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
            {msg.role === "assistant" && (
              <div className={styles.assistantRow}>
                <img
                  src="/alfonso-avatar.png"
                  alt="Alfonso"
                  className={styles.avatar}
                  draggable={false}
                />
                <div>
                  <div className={styles.name}>Alfonso</div>
                  <div className={styles.bubble}>{formatMessage(msg.content)}</div>
                  <div className={styles.timestamp}>{formatTime(new Date(msg.timestamp))}</div>
                </div>
              </div>
            )}
            {msg.role === "user" && (
              <>
                <div className={styles.bubble}>{formatMessage(msg.content)}</div>
                <div className={styles.timestamp}>{formatTime(new Date(msg.timestamp))}</div>
              </>
            )}
          </div>
        ))}

        {loading && typingText && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.assistantRow}>
              <img
                src="/alfonso-avatar.png"
                alt="Alfonso"
                className={styles.avatar}
                draggable={false}
              />
              <div>
                <div className={styles.name}>Alfonso</div>
                <div className={styles.bubbleTyping}>{formatMessage(typingText)}</div>
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
          placeholder="Napiš svůj dotaz…"
          disabled={loading}
          className={styles.input}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={styles.button}
          aria-label="Odeslat zprávu"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
