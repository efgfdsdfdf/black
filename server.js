import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI || null;
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  const { message, user } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing 'message' in request body" });

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('OpenAI error', response.status, txt);
      return res.status(502).json({ error: 'OpenAI API error', details: txt });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
    // persist conversation to disk (append user message and bot reply)
    try{
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const file = path.join(dataDir, 'chat_history.json');
      let store = {};
      if(fs.existsSync(file)){
        const raw = fs.readFileSync(file, 'utf8') || '{}';
        store = JSON.parse(raw || '{}');
      }
      const key = user || 'guest';
      store[key] = store[key] || [];
      store[key].push({ from: 'user', text: message, time: Date.now() });
      store[key].push({ from: 'bot', text: reply, time: Date.now() });
      fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
    }catch(e){ console.error('Failed to persist chat', e); }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

// Return history for a user
app.get('/history/:user', (req, res) => {
  const { user } = req.params;
  try{
    const file = path.join(process.cwd(), 'server', 'data', 'chat_history.json');
    if(!fs.existsSync(file)) return res.json({ history: [] });
    const raw = fs.readFileSync(file, 'utf8') || '{}';
    const store = JSON.parse(raw || '{}');
    return res.json({ history: store[user] || [] });
  }catch(e){ console.error('Failed to read history', e); return res.status(500).json({ error: 'Failed to read history' }); }
});

// Delete history for a user
app.delete('/history/:user', (req, res) => {
  const { user } = req.params;
  try{
    const file = path.join(process.cwd(), 'server', 'data', 'chat_history.json');
    let store = {};
    if(fs.existsSync(file)){
      const raw = fs.readFileSync(file, 'utf8') || '{}';
      store = JSON.parse(raw || '{}');
    }
    delete store[user];
    // write back
    const dataDir = path.join(process.cwd(), 'server', 'data');
    if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
    return res.json({ ok: true });
  }catch(e){ console.error('Failed to delete history', e); return res.status(500).json({ error: 'Failed to delete history' }); }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
