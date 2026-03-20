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

  const { domain, email, token, limit = 100, channel = 'whatsapp', tag = '', page = 1 } = req.body;

  if (!domain || !email || !token) {
    return res.status(400).json({ error: 'domain, email e token são obrigatórios' });
  }

  const base64 = Buffer.from(`${email}/token:${token}`).toString('base64');
  const perPage = Math.min(100, limit);

  let query = 'type:ticket';
  if (channel !== 'all') query += `+via:${channel}`;
  if (tag) query += `+tags:${tag}`;

  const url = `https://${domain}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&sort_by=created_at&sort_order=desc`;

  try {
    const zdRes = await fetch(url, {
      headers: {
        'Authorization': `Basic ${base64}`,
        'Content-Type': 'application/json'
      }
    });

    if (!zdRes.ok) {
      const text = await zdRes.text();
      return res.status(zdRes.status).json({ error: `Zendesk retornou ${zdRes.status}`, detail: text });
    }

    const data = await zdRes.json();
    return res.status(200).json({
      tickets: data.results || [],
      count: data.count || 0,
      next_page: data.next_page || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
