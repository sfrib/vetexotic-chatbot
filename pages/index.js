import { useState } from 'react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4", // nebo "gpt-3.5-turbo"
      messages: [
        {
          role: "system",
          content:
            "Jsi přátelský veterinární asistent kliniky VetExotic. Mluvíš česky a pomáháš s péčí o exotická zvířata. Buď přímý, věcný, ale přívětivý. V urgentních případech odkazuj na pohotovost."
        },
        ...newMessages,
      ]
    });

    const botMsg = {
      role: 'assistant',
      content: chatCompletion.choices[0].message.content
    };

    setMessages([...newMessages, botMsg]);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, width: 360, height: 520, zIndex: 9999, background: 'white', borderRadius: 14, boxShadow: '0 0 10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>

