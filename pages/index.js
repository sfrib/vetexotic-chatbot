import { useState } from 'react';
import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    const res = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Jsi přátelský virtuální veterinární asistent kliniky VetExotic. Mluvíš česky, stručně, radíš ohledně exotických zvířat a v akutních případech doporučuješ kontaktovat kliniku." },
        ...newMessages
      ]
    });
    const botMsg = { role: 'assistant', content: res.data.choices[0].message.content };
    setMessages([...newMessages, botMsg]);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, width: 360, height: 520, zIndex: 9999, background: 'white', borderRadius: 14, boxShadow: '0 0 10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>
            <span style={{ padding: 8, background: m.role === 'user' ? '#daf1ee' : '#f1f1f1', borderRadius: 8 }}>{m.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #ddd' }}>
        <input style={{ flex: 1, padding: 10, border: 'none' }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Napiš sem text…" />
        <button onClick={sendMessage} style={{ padding: '10px 15px', border: 'none', background: '#0070f3', color: 'white', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}
