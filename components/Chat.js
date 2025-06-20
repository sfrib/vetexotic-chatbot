import React, { useState, useEffect, useRef } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Jsem Alfonso, virtuální asistent VetExotic. Jak ti mohu pomoci?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Animace postupného psaní odpovědi
  const animateTyping = (fullText) => {
    return new Promise((resolve) => {
      let index = 0;
      setIsTyping(true);
      const interval = setInterval(() => {
        setMessages((prev) => {
          // Pokud je poslední zpráva už Alfonso, uprav ji, jinak přidej novou
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText.slice(0, index + 1),
            };
            return updated;
          } else {
            return [...prev, { role: "assistant", content: fullText.slice(0, index + 1) }];
          }
        });

        index++;
        if (index === fullText.length) {
          clearInterval(interval);
          setIsTyping(false);
          resolve();
        }
      }, 30); // rychlost psaní v ms
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      setIsTyping(true);

      // Pošli na backend zprávu i historii bez system role
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          history: newMessages.filter((m) => m.role !== "system"),
        }),
      });

      const data = await res.json();
      if (data.error) {
        await animateTyping("Omlouvám se, nastala chyba: " + data.error);
      } else {
        await animateTyping(data.reply);
      }
    } catch (e) {
      await animateTyping("Nastala chyba při spojení se serverem.");
    }
  };

  // Odeslání zprávy na Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages
          .filter((m) => m.role !== "system") // skryj systemovou zprávu v UI
          .map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.messageBubble,
                ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {msg.content}
            </div>
          ))}
        {isTyping && (
          <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
            Alfonso píše<span className="blinking-cursor">|</span>
          </div>
        )}
      </div>
      <textarea
        style={styles.textarea}
        rows={2}
        placeholder="Napiš sem zprávu..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isTyping}
      />
      <button style={styles.sendButton} onClick={sendMessage} disabled={isTyping || !input.trim()}>
        Odeslat
      </button>

      <style jsx>{`
        .blinking-cursor {
          font-weight: 100;
          font-size: 20px;
          color: #555;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  chatContainer: {
    width: "100%",
    maxWidth: "600px",
    height: "80vh",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #ccc",
    borderRadius: "15px",
    padding: "15px",
    backgroundColor: "#f5f8fa",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "12px 15px",
    borderRadius: "20px",
    fontSize: "16px",
    lineHeight: "1.4",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
  userBubble: {
    backgroundColor: "#0084ff",
    color: "white",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  assistantBubble: {
    backgroundColor: "#e5e5ea",
    color: "#000",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  textarea: {
    resize: "none",
    borderRadius: "10px",
    border: "1px solid #ccc",
    padding: "10px",
    fontSize: "16px",
    marginTop: "10px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  sendButton: {
    marginTop: "10px",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#0084ff",
    color: "white",
    cursor: "pointer",
    userSelect: "none",
    disabled: {
      backgroundColor: "#999",
      cursor: "not-allowed",
    },
  },
};
