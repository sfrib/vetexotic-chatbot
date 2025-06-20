import { useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Configuration, OpenAIApi } from "openai";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `Jsi přátelský chatbot pro VetExotic, kliniku specializující se na exotická zvířata. 
Mluvíš česky a pomáháš lidem s informacemi o chovu, inkubaci vajec, běžných nemocech (bez rad na léčbu a dávkování).
Pomáháš taky zjistit, jestli je stav akutní a nasměruješ na pohotovost: +420 724 190 384.
Pomáháš s objednáváním na vyšetření s odkazem na online kalendář: https://vetexotic.vetbook.cloud/kalendar.php.
Nikdy nedáváš veterinární léčebné rady, vždy doporučuješ kontaktovat veterináře.
Buď přátelský, profesionální a srozumitelný.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);

    const newMessages = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMessages);

    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: newMessages,
        max_tokens: 800,
        temperature: 0.7,
      });

      setMessages((prev) => [
        ...prev,
        completion.data.choices[0].message,
      ]);
      setInput("");
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Omlouvám se, něco se pokazilo. Zkus to prosím znovu později.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <Head>
        <title>VetExotic Chatbot</title>
        <meta name="description" content="Chatbot pro VetExotic" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <div className={styles.chatbox}>
          {messages
            .filter((m) => m.role !== "system")
            .map((message, idx) => (
              <div
                key={idx}
                className={
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }
              >
                {message.content}
              </div>
            ))}

          <textarea
            rows={2}
            placeholder="Napište zprávu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? "Odesílám..." : "Odeslat"}
          </button>
        </div>
      </main>
    </>
  );
}
