import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;

  // ✳️ 1. Ukládání nových znalostí přes příkaz **interně//
  if (message.startsWith("**interně//")) {
    const newKnowledge = message.replace("**interně//", "").trim();
    const filePath = path.resolve(process.cwd(), 'knowledge.json');

    try {
      const existing = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
        : [];

      existing.push({
        content: newKnowledge,
        addedAt: new Date().toISOString(),
      });

      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");

      return res.status(200).json({ reply: "✅ Nová znalost byla uložena do interní databáze." });
    } catch (err) {
      return res.status(500).json({ error: "❌ Chyba při ukládání znalosti." });
    }
  }

  // ✳️ 2. Načítání znalostí z databáze knowledge.json
  const filePath = path.resolve(process.cwd(), 'knowledge.json');
  let dynamicKnowledgeText = "";

  try {
    if (fs.existsSync(filePath)) {
      const knowledgeData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      dynamicKnowledgeText = knowledgeData.map((item, i) => `• ${item.content}`).join("\n");
    }
  } catch (err) {
    console.error("❌ Chyba při načítání knowledge.json:", err);
  }

  // ✳️ 3. Prompty
  const systemPrompt = {
    role: "system",
    content: `
Jsi Alfonso, virtuální veterinární asistent kliniky VetExotic. Specializuješ se na exotická zvířata: papoušky, plazy, želvy, leguány, hady, drobné savce (fretky, králíky, ježky).

🧠 Znalosti čerpáš z nejlepší veterinární praxe a špičkových chovatelských zkušeností. Cílem je chránit život zvířat a pomoci majitelům.

🔍 Pokud je stav vážný, vysvětli riziko, doporuč kontakt na kliniku a varuj před odkladem.

🚫 Nikdy nedávej rady pro psy, kočky nebo lidi. Nepiš o lidských lécích nebo čajích.

📆 Pokud je potřeba, nabídni pohotovostní linku nebo objednání.

💬 Odpovídej přátelsky a klidně. Pomáhej logicky a jasně.
`
  };

  const knowledgeExamples = {
    role: "user",
    content: `📌 Příklady situací:

1. Papoušek zvrací a je nafouklý → možná dilatace volátka. Naléhavé.
2. Fretka apatická a studená → možná hypoglykemie. Nutná urgentní pomoc.
3. Želva neotvírá oči, nejí → možná avitaminóza nebo infekce. Nutná kontrola.
4. Leguán má nateklé končetiny → metabolická choroba kostí.
5. Papoušek si vytrhává peří → stres, bolest nebo parazité.
6. Had nežere týdny → špatné podmínky nebo nemoc.
7. Králík přestal žrát → stasis, torze, akutní riziko.

Další znalosti:
${dynamicKnowledgeText}
`
  };

  const messages = [
    systemPrompt,
    knowledgeExamples,
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: "user", content: message },
  ];

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.5,
      }),
    });

    const data = await completion.json();

    if (completion.ok) {
      res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: data.error.message || "Chyba při získávání odpovědi." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || "Chyba serveru." });
  }
}
