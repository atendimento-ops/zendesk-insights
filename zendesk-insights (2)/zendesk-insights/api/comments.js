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

  const { domain, email, token, ticketId } = req.body;

  if (!domain || !email || !token || !ticketId) {
    return res.status(400).json({ error: 'Campos obrigatórios: domain, email, token, ticketId' });
  }

  const base64 = Buffer.from(`${email}/token:${token}`).toString('base64');
  const url = `https://${domain}.zendesk.com/api/v2/tickets/${ticketId}/comments.json`;

  try {
    const zdRes = await fetch(url, {
      headers: {
        'Authorization': `Basic ${base64}`,
        'Content-Type': 'application/json'
      }
    });

    if (!zdRes.ok) {
      return res.status(zdRes.status).json({ error: `Zendesk retornou ${zdRes.status}` });
    }

    const data = await zdRes.json();
    return res.status(200).json({ comments: data.comments || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
