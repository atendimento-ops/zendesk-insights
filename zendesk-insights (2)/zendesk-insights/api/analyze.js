export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticketSummaries } = req.body;

  if (!ticketSummaries) {
    return res.status(400).json({ error: 'ticketSummaries é obrigatório' });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do Vercel' });
  }

  const prompt = `Você é um especialista em análise de cobranças e renegociação de dívidas. Analise os seguintes tickets de atendimento do WhatsApp e gere um relatório detalhado em JSON.

TICKETS:
${ticketSummaries}

Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem texto extra):
{
  "total_tickets": <número>,
  "taxa_resolucao": <número entre 0-100>,
  "total_objections": <número>,
  "sentiment_score": <número 1-10>,
  "objections": [
    {"label": "texto da objeção", "pct": <número 0-100>, "type": "red|amber|green"}
  ],
  "sentiment_phases": [
    {"phase": "Abertura", "positive": <0-100>, "neutral": <0-100>, "negative": <0-100>},
    {"phase": "Negociação", "positive": <0-100>, "neutral": <0-100>, "negative": <0-100>},
    {"phase": "Fechamento", "positive": <0-100>, "neutral": <0-100>, "negative": <0-100>}
  ],
  "patterns_work": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "patterns_fail": ["tag1", "tag2", "tag3", "tag4"],
  "client_profile": "Descrição detalhada de 3-4 frases sobre o perfil do cliente que aceita renegociar.",
  "tips": [
    "Dica 1",
    "Dica 2",
    "Dica 3",
    "Dica 4",
    "Dica 5"
  ],
  "script": "Script completo para contorno de objeções. Use [OBJEÇÃO: ...] e [RESPOSTA: ...] para organizar as 3 objeções mais comuns."
}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const text = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: `Claude API retornou ${claudeRes.status}`, detail: text });
    }

    const data = await claudeRes.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
