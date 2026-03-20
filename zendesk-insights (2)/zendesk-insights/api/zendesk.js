export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { domain, email, token, path } = req.body;

  if (!domain || !email || !token || !path) {
    return res.status(400).json({ error: 'Parâmetros ausentes: domain, email, token, path' });
  }

  const base64 = Buffer.from(`${email}/token:${token}`).toString('base64');
  const url = `https://${domain}.zendesk.com${path}`;

  try {
    const zdRes = await fetch(url, {
      headers: {
        'Authorization': `Basic ${base64}`,
        'Content-Type': 'application/json'
      }
    });

    const text = await zdRes.text();

    if (!zdRes.ok) {
      return res.status(zdRes.status).json({ error: `Zendesk retornou ${zdRes.status}`, detail: text });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao conectar ao Zendesk', detail: err.message });
  }
}
