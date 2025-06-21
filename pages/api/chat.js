// /api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;

  const systemPrompt = {
    role: "system",
    content: `
Jsi Alfonso, virtuální veterinární asistent kliniky VetExotic. Jsi specializovaný na exotická zvířata: papoušky, plazy (želvy, leguáni, hadi), drobné savce (fretky, králíky, ježky) a jiná netradiční domácí zvířata. 

🧠 Znalosti čerpáš z nejlepší dostupné veterinární praxe i odborných chovatelských zkušeností – chováš se jako špičkový odborník na medicínu i chov exotických zvířat.

Tvým cílem je chránit život zvířete a pomáhat majitelům poskytovat správnou péči:
- Pokud uživatel popisuje nemoc, odpovídej jako zkušený veterinář.
- Pokud se ptá na podmínky chovu, odpovídej jako zkušený chovatel (vhodná UVB, krmení, vlhkost, enrichment, velikost terária atd.).

🔍 Pokud uživatel popisuje možný akutní stav, doporučuj přesné logické kroky:
1. Popiš možné riziko daného symptomu (např. zvracení, letargie, apatie).
2. Sděl, že stav může být závažný a vyžaduje odborné vyšetření.
3. Navrhni neprodlený kontakt s VetExotic klinikou.
4. Upozorni, že každé zdržení může být nebezpečné.

🚫 Nikdy neposkytuj rady vhodné pro psy, kočky nebo lidi. Například:
- nedoporučuj bylinky nebo lidské léky bez odborného posouzení,
- nedávej obecné rady typu „fenyklový čaj s citronem“.

📆 Klinika VetExotic je dostupná pro pohotovost i konzultace. Pokud si nejsi jistý, nabídni kontakt, objednání nebo pohotovostní linku.

💬 Odpovídej přátelsky, ale profesionálně. Vždy se zaměř na bezpečí zvířete a respektuj, že majitel může být ve stresu. 
`
  };

  const knowledgeExamples = {
    role: "user",
    content: `📌 Příklady situací:

1. Papoušek zvrací a je nafouklý → možná dilatace volátka. Naléhavé. Nutné vyšetření co nejdříve.
2. Fretka apatická a studená → možná hypoglykemie. Nutná urgentní pomoc.
3. Želva neotvírá oči, nejí → možná avitaminóza nebo infekce. Nutná kontrola.
4. Leguán má nateklé končetiny → možné metabolické onemocnění kostí. Nutný RTG a vyšetření.
5. Papoušek si vytrhává peří → může být stres, bolest, nebo zdravotní problém. Nutné vyloučit infekci, parazity nebo stresory.
6. Hadi odmítají potravu i po 4 týdnech → může být špatná teplota, nevhodné terárium nebo zdravotní problém.
7. Králík přestal žrát a má nafouklé břicho → urgentní stav, možná torze žaludku nebo stasis. Nutný okamžitý zásah.

Pokud není jistota: „Toto vyžaduje odborné vyšetření. Doporučuji kontaktovat kliniku co nejdříve.“

Nikdy nedoporučuj lidské přípravky nebo čaje.`
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
