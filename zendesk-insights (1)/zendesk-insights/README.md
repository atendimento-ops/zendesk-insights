# Zendesk Insights — Renegociação de Dívidas

App para analisar tickets do WhatsApp no Zendesk e extrair insights sobre renegociação de dívidas, objeções e oportunidades de melhoria.

---

## Deploy no Vercel (passo a passo)

### 1. Instale o Git e faça upload do projeto

Você pode usar o GitHub ou fazer upload direto pelo Vercel.

**Opção A — Via GitHub (recomendado):**
1. Crie um repositório no GitHub e suba esta pasta
2. Acesse vercel.com → "Add New Project" → importe o repositório

**Opção B — Via Vercel CLI:**
```bash
npm i -g vercel
cd zendesk-insights
vercel
```

### 2. Configure a variável de ambiente

No painel do Vercel, vá em:
**Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `ANTHROPIC_API_KEY` | sua chave da API da Anthropic |

Você obtém a chave em: https://console.anthropic.com/

### 3. Acesse o app

Após o deploy, o Vercel gera uma URL como `https://zendesk-insights-xyz.vercel.app`.
Abra no navegador e configure sua conexão com o Zendesk.

---

## Como obter o Token do Zendesk

1. Zendesk Admin Center
2. Apps e integrações → APIs → API Zendesk
3. Token de API → Adicionar token
4. Copie o token (ele só aparece uma vez)

---

## Estrutura do projeto

```
zendesk-insights/
├── api/
│   ├── tickets.js      # Proxy: busca tickets no Zendesk
│   ├── comments.js     # Proxy: busca comentários de um ticket
│   └── analyze.js      # Proxy: envia para Claude e retorna insights
├── public/
│   └── index.html      # Frontend completo
├── vercel.json         # Configuração de rotas
└── package.json
```

---

## Observações sobre o filtro de WhatsApp

O app usa `via:whatsapp` na query de busca do Zendesk.
Se sua integração WhatsApp usa um conector de terceiros (Zenvia, Twilio, Take, Sinch), 
os tickets podem estar registrados como canal `api`. Nesse caso:
- Selecione "Todos os canais"
- Use a tag adicional (ex: `whatsapp`) para filtrar
