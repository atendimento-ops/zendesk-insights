export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ticketSummaries } = req.body;
  if (!ticketSummaries) return res.status(400).json({ error: 'ticketSummaries é obrigatório' });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' });

  const prompt = `Você é um especialista em análise de cobranças e renegociação de dívidas. Analise os seguintes tickets e gere um relatório em JSON.

TICKETS:
${ticketSummaries}

Retorne APENAS um JSON válido com esta estrutura (sem markdown, sem texto extra):
{
  "total_tickets": 0,
  "taxa_resolucao": 0,
  "total_objections": 0,
  "sentiment_score": 0,
  "objections": [{"label": "texto", "pct": 0, "type": "red"}],
  "sentiment_phases": [
    {"phase": "Abertura", "positive": 0, "neutral": 0, "negative": 0},
    {"phase": "Negociação", "positive": 0, "neutral": 0, "negative": 0},
    {"phase": "Fechamento", "positive": 0, "neutral": 0, "negative": 0}
  ],
  "patterns_work": ["tag1"],
  "patterns_fail": ["tag1"],
  "client_profile": "descrição",
  "tips": ["dica1"],
  "script": "script completo com [OBJEÇÃO: ...] e [RESPOSTA: ...]"
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
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const text = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: `Claude retornou ${claudeRes.status}`, detail: text });
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
