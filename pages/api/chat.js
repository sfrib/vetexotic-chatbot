export default async function handler(req, res) {
  const messages = req.body.messages;

  const systemMessage = {
    role: "system",
    content: `
Jsi přátelský asistent veterinární kliniky VetExotic. Nikdy nedáváš dávkování léků, diagnostiku ani léčbu. Můžeš pomoci s chovem, inkubací vajec, orientačním určením akutnosti a nasměrováním klienta na veterináře nebo objednávku. Česky odpovídej přirozeně.

Pokud někdo zmíní krvácení, záchvat, kolaps: doporuč kontaktovat pohotovost +420 724 190 384.

Pokud někdo chce objednat: odkaž na https://vetexotic.vetbook.cloud/kalendar.php nebo tel. +420 724 190 384.
    `,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [systemMessage, ...messages],
      temperature: 0.6,
    }),
  });

  const data = await response.json();
  res.status(200).json({ reply: data.choices[0].message });
}
