
/* Black - Local demo chatbot with optional OpenAI integration and user greeting */
/* To enable real AI replies, set localStorage.OPENAI_API_KEY = "sk-..." or change the call in getRemoteReply to include your server-side proxy. */

(function(){
  window.Black = {
    name: "Black",
    // If OPENAI_API_KEY is present in localStorage, this will use the OpenAI Chat Completions endpoint directly.
    // NOTE: Embedding API keys in client-side code is insecure. Prefer a server-side proxy. This is provided as a developer convenience placeholder.
    async getRemoteReply(message){
      // Prefer calling the local server proxy if available
      const user = localStorage.getItem('currentUser') || localStorage.getItem('loggedInUser') || localStorage.getItem('username') || '';
      const serverUrl = (window.location.origin || '') + '/server';
      // Try project's server endpoint at /server/chat (the project has server/server.js listening on a separate process normally).
      // We'll try a same-origin /chat first (if the server is proxied), then fallback to direct OpenAI if OPENAI_API_KEY exists in localStorage.
      try{
        // attempt to call relative /server/chat or /chat endpoints
        const endpoints = [SERVER_BASE + '/chat', SERVER_BASE + '/server/chat'];
        for(const url of endpoints){
          try{
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, user }) });
            if(resp && resp.ok){
              const j = await resp.json();
              return j.reply || null;
            }
          }catch(e){ /* try next */ }
        }
      }catch(e){ /* ignore */ }

      // Fallback: if OPENAI_API_KEY present in client localStorage, use it (developer-only)
      const key = localStorage.getItem('OPENAI_API_KEY');
      if(!key) return null;
      try{
        const userContent = (user ? `[user:${user}] ` : '') + message;
        const payload = {
          model: "gpt-4o-mini",
          messages: [ { role: 'system', content: 'You are Black, a helpful assistant.' }, { role: 'user', content: userContent } ],
          max_tokens: 400
        };
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
          body: JSON.stringify(payload)
        });
        if(!resp.ok) return null;
        const j = await resp.json();
        const reply = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
        return reply || null;
      }catch(e){ console.error('Remote reply failed', e); return null; }
    },
    // Fallback local rule-based reply
    getLocalReply(message){
      const m = message.trim().toLowerCase();
      if(!m) return "Say something — I'm listening.";
      if(/hello|hi|hey|good (morning|afternoon|evening)/.test(m)){
        return "Hello! I'm Black — your assistant. How can I help today?";
      }
      if(/\bhelp|support|assist\b/.test(m)){
        return "I can help with basic tasks: explain code, give suggestions, or demo simple Q&A. Try asking me to 'explain index.html' or 'how do I start the app'.";
      }
      if(/\b(thank|thx|thanks)\b/.test(m)){
        return "You're welcome — glad to help!";
      }
      if(/\b(error|bug|fix|issue)\b/.test(m)){
        return "If there's an error, paste the message here and I'll try to suggest fixes.";
      }
      if(/\b(time|date)\b/.test(m)){
        return "Today's date is " + new Date().toLocaleString();
      }
      return "I don't fully understand yet — try asking 'how do I run this project' or 'where is index.html'.";
    },
    // main entry - will prefer remote reply if API key present, otherwise local reply
    async getBotReply(message){
      const remote = await this.getRemoteReply(message);
      if(remote) return remote;
      return this.getLocalReply(message);
    }
  };

  // Build chat UI and functionality
  function createChatWidget(){
    // If the page already has a chat container (ai.html), integrate into it instead
    const pageChatContainer = document.querySelector('.chat-container');
    let chat = null;
    let bubble = null;
    if (!pageChatContainer) {
      if(document.getElementById("black-chat")) return; // already present
      chat = document.createElement("div");
      chat.id = "black-chat";
      chat.innerHTML = `
        <div class="header">
          <div class="avatar">B</div>
          <div style="flex:1">
            <div class="title">Black</div>
            <div class="subtitle" id="black-subtitle">Local demo assistant</div>
          </div>
          <div style="margin-left:8px"><button id="black-close" aria-label="close">✕</button></div>
        </div>
        <div class="messages" id="black-messages" role="log" aria-live="polite"></div>
        <div class="input">
          <input id="black-input" type="text" placeholder="Ask Black something..."/>
          <button id="black-send" aria-label="send">Send</button>
        </div>
      `;
      document.body.appendChild(chat);

      bubble = document.createElement("button");
      bubble.id = "black-chat-bubble";
      bubble.innerHTML = "B";
      bubble.title = "Open chat with Black";
      document.body.appendChild(bubble);

      const themeToggle = document.getElementById("theme-toggle") || (function(){
        const t = document.createElement("button");
        t.id = "theme-toggle";
        t.title = "Toggle theme";
        t.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        document.body.appendChild(t);
        return t;
      })();

      const hint = document.querySelector(".theme-hint") || (function(){
        const h = document.createElement("div");
        h.className = "theme-hint";
        h.innerText = "Light / Dark";
        document.body.appendChild(h);
        return h;
      })();

      const closeBtn = chat.querySelector("#black-close");
      closeBtn.addEventListener("click", ()=> chat.style.display = "none");

      bubble.addEventListener("click", ()=> {
        chat.style.display = (chat.style.display==="flex") ? "none" : "flex";
        const bi = document.getElementById("black-input"); if(bi) bi.focus();
      });
    }

  // If the page provides its own chat container (ai.html), wire into that instead
    let sendBtn = document.getElementById("black-send");
    let input = document.getElementById("black-input");
    let messages = document.getElementById("black-messages");
    const pageChat = pageChatContainer || document.querySelector('.chat-container');
    if(pageChat){
      messages = pageChat.querySelector('.chat-box') || messages;
      // try to find input and send button inside the page container
      input = pageChat.querySelector('input[type="text"]') || input;
      sendBtn = pageChat.querySelector('#sendBtn') || pageChat.querySelector('button') || sendBtn;
    }

  // Base URL for the backend server (use your local server). Update if different.
  const SERVER_BASE = 'http://localhost:5000';

    function addMessage(text, who, meta){
      const d = document.createElement("div");
      const cls = (who==="user" ? "user" : "bot");
      d.className = "msg " + cls;
      // include simple meta (username or timestamp) if provided
      let prefix = '';
      if(meta && meta.username) prefix = '<div class="msg-meta">' + escapeHtml(meta.username) + (meta.time ? ' · ' + new Date(meta.time).toLocaleString() : '') + '</div>';
      // support simple markdown-like link rendering
      d.innerHTML = prefix + '<div class="msg-body">' + escapeHtml(text).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>') + '</div>';
      messages.appendChild(d);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage(v){
      if(!v) return;
      const curUser = getLoggedUser() || 'Guest';
      addMessage(v, "user", { username: curUser, time: Date.now() });
      input && (input.value = "");

      // If there's a pendingAction awaiting confirmation, treat this message as confirmation
      if(pendingAction){
        const txt = (v || '').trim().toLowerCase();
        if(/^(yes|y|confirm|ok|sure)$/.test(txt)){
          executeAction(pendingAction);
          pendingAction = null;
          return;
        }
        if(/^(no|n|cancel|stop)$/.test(txt)){
          addMessage('Action cancelled.', 'bot');
          pendingAction = null;
          return;
        }
        // not a confirmation; fall through to normal processing
      }

      // First, interpret whether the user is asking the AI to perform an action
      const action = interpretAction(v);
      if(action){
        // Ask for explicit confirmation before executing
        pendingAction = action;
        addMessage(`I can ${action.human}. Do you want me to proceed? Reply 'yes' to confirm.`, "bot");
        return;
      }

      addMessage("...", "bot");
      try{
        const reply = await window.Black.getBotReply(v);
        // replace the last "..." message
        const last = messages.querySelectorAll(".msg.bot");
        if(last.length) last[last.length-1].textContent = reply;
        else addMessage(reply, "bot");
        // persist the new user message and bot reply
        persistMessage(curUser, { from: 'user', text: v, time: Date.now() });
        persistMessage(curUser, { from: 'bot', text: reply, time: Date.now() });
      }catch(e){
        const last = messages.querySelectorAll(".msg.bot");
        if(last.length) last[last.length-1].textContent = "Sorry, something went wrong.";
        else addMessage("Sorry, something went wrong.", "bot");
      }
    }

    // Pending action waiting for user confirmation
    let pendingAction = null;

    // Simple interpreter that recognizes a few actionable intents
    function interpretAction(text){
      if(!text || typeof text !== 'string') return null;
      const t = text.trim();
      // logout
      if(/\b(log ?out|sign ?out|log ?off)\b/i.test(t)){
        return { type: 'logout', human: 'log you out' };
      }
      // add course: "add course Physics 101 grade A units 3"
      let m = t.match(/add course ([\w \-\d\(\)]+) grade (A|B|C|D|E|F) units (\d+)/i);
      if(m){ return { type: 'add_course', human: `add course ${m[1]} (grade ${m[2]}, ${m[3]} units)`, params: { name: m[1].trim(), grade: m[2].toUpperCase(), units: parseInt(m[3],10) } }; }
      // add note: "add note Buy milk"
      m = t.match(/add note (.+)/i);
      if(m){ return { type: 'add_note', human: `add a note: "${m[1]}"`, params: { text: m[1].trim() } }; }
      // update bio: "update bio I'm a CS student"
      m = t.match(/(?:update|set) bio (?:to )?(.+)/i);
      if(m){ return { type: 'update_bio', human: `update your bio to: "${m[1]}"`, params: { bio: m[1].trim() } }; }
      // schedule class: "schedule class Maths on Monday at 09:00 notify 10"
      m = t.match(/schedule class ([\w \-\d\(\)]+) on (\w+) at (\d{1,2}:?\d{0,2})(?: notify (\d+))?/i);
      if(m){ return { type: 'add_timetable', human: `schedule class ${m[1]} on ${m[2]} at ${m[3]}`, params: { course: m[1].trim(), day: m[2], time: m[3], notifyBefore: parseInt(m[4]||0,10) } }; }
      return null;
    }

    // Execute a confirmed action
    function executeAction(action){
      const user = localStorage.getItem('currentUser') || localStorage.getItem('loggedInUser');
      if(!user){ addMessage('No logged in user; cannot perform action.', 'bot'); return; }

      try{
        switch(action.type){
          case 'logout':
            localStorage.removeItem('currentUser');
            localStorage.removeItem('loggedInUser');
            addMessage('You have been logged out.', 'bot');
            window.location.href = 'login.html';
            break;
          case 'add_course':{
            const key = `gpaCourses_${user}`;
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            list.push({ name: action.params.name, grade: action.params.grade, units: action.params.units });
            localStorage.setItem(key, JSON.stringify(list));
            // Refresh UI if displayCourses exists
            if(typeof displayCourses === 'function') displayCourses();
            addMessage(`Added course ${action.params.name}.`, 'bot');
            break;
          }
          case 'add_note':{
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if(!users[user]) users[user] = { password:'', notes:[], timetable:[], gpa:[], profile:{} };
            if(!Array.isArray(users[user].notes)) users[user].notes = [];
            users[user].notes.push(action.params.text);
            localStorage.setItem('users', JSON.stringify(users));
            if(window.__notes && typeof window.__notes.renderNotes === 'function') window.__notes.renderNotes();
            addMessage('Note added.', 'bot');
            break;
          }
          case 'update_bio':{
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if(!users[user]) users[user] = { password:'', notes:[], timetable:[], gpa:[], profile:{} };
            users[user].profile = users[user].profile || {};
            users[user].profile.bio = action.params.bio;
            localStorage.setItem('users', JSON.stringify(users));
            // Try to refresh profile UI
            if(typeof displayProfile === 'function') displayProfile();
            // fallback: reload profile section if present
            if(document.getElementById('bioText')) document.getElementById('bioText').textContent = action.params.bio;
            addMessage('Bio updated.', 'bot');
            break;
          }
          case 'add_timetable':{
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if(!users[user]) users[user] = { password:'', notes:[], timetable:[], gpa:[], profile:{} };
            if(!Array.isArray(users[user].timetable)) users[user].timetable = [];
            users[user].timetable.push({ course: action.params.course, day: action.params.day, time: action.params.time, notifyBefore: action.params.notifyBefore || 0 });
            localStorage.setItem('users', JSON.stringify(users));
            if(typeof loadTimetable === 'function') loadTimetable();
            addMessage('Class scheduled.', 'bot');
            break;
          }
          default:
            addMessage('Sorry, I cannot execute that action yet.', 'bot');
        }
      }catch(e){
        console.error('Action execution failed', e);
        addMessage('Failed to perform the action: ' + e.message, 'bot');
      }
    }

    // Listen for simple confirmations (yes/no)
    const originalInputHandler = input ? input.onkeydown : null;
    // Note: messages entered by user go through sendMessage which will set pendingAction when needed.
    // We handle 'yes'/'y'/'no' in the main message flow below when user replies.

  if(sendBtn) sendBtn.addEventListener("click", ()=> sendMessage(input ? input.value : ''));
  if(input) input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendMessage(input.value); });

    // Theme management
    function applyTheme(theme){ document.documentElement.setAttribute("data-theme", theme); try{ localStorage.setItem("black_theme", theme);}catch(e){} }
    themeToggle.addEventListener("click", ()=> { const cur = document.documentElement.getAttribute("data-theme") || "dark"; applyTheme(cur==="dark"?"light":"dark"); });
    try{ const saved = localStorage.getItem("black_theme") || "dark"; applyTheme(saved); }catch(e){}

    // Greet logged user if available
    function getLoggedUser(){
      return localStorage.getItem("currentUser") || localStorage.getItem("loggedInUser") || localStorage.getItem("username") || localStorage.getItem("user") || "";
    }
    // escape HTML to avoid injection in messages
    function escapeHtml(str){
      if(!str && str !== 0) return '';
      return String(str).replace(/[&<>\"]/g, function(s){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s];
      });
    }

    // Persistence helpers: save/load per-user chat history
    function historyKeyFor(user){ return 'chat_history_' + (user || 'guest'); }
    function persistMessage(user, msg){
      try{
        const key = historyKeyFor(user);
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(msg);
        localStorage.setItem(key, JSON.stringify(arr));
      }catch(e){ console.warn('Could not persist message', e); }
    }
    function loadHistory(user){
      try{
        const key = historyKeyFor(user);
        return JSON.parse(localStorage.getItem(key) || '[]');
      }catch(e){ return []; }
    }
    const user = getLoggedUser();
    // show username in page if provided (auth.js also updates username-display)
    const sub = document.getElementById("black-subtitle");
    if(sub) sub.textContent = user ? ("Hello, " + user) : "Local demo assistant";

    // load and render history for this user (try server first, fallback to localStorage)
    (async function renderHistory(){
      let hist = [];
      try{
        // endpoints to try
        const endpoints = [SERVER_BASE + '/history/' + encodeURIComponent(user || 'guest'), SERVER_BASE + '/server/history/' + encodeURIComponent(user || 'guest')];
        for(const url of endpoints){
          try{
            const r = await fetch(url);
            if(r && r.ok){ const j = await r.json(); hist = j.history || []; break; }
          }catch(e){ /* try next */ }
        }
      }catch(e){ /* ignore */ }
      if(!hist || !hist.length){ hist = loadHistory(user); }

      if(hist && hist.length){
        hist.forEach(m => {
          addMessage(m.text, m.from === 'user' ? 'user' : 'bot', { username: m.from === 'user' ? (user || 'Guest') : 'Black', time: m.time });
        });
      } else {
        setTimeout(()=> addMessage(user ? ("Hello " + user + "! I'm Black — ask me anything about this project or your account.") : "Hello — I'm Black. Ask me something!", "bot"), 600);
      }
    })();

    // Wire up Clear / Export history buttons if present
    const clearBtn = document.getElementById('clearHistoryBtn');
    const exportBtn = document.getElementById('exportHistoryBtn');
    if(clearBtn){
      clearBtn.addEventListener('click', async ()=>{
        const u = getLoggedUser() || 'guest';
        if(!confirm('Clear chat history for ' + u + '? This cannot be undone.')) return;
        // try server delete endpoints first
        const endpoints = [SERVER_BASE + '/history/' + encodeURIComponent(u), SERVER_BASE + '/server/history/' + encodeURIComponent(u)];
        let done = false;
        for(const ep of endpoints){
          try{
            const r = await fetch(ep, { method: 'DELETE' });
            if(r && r.ok){ done = true; break; }
          }catch(e){ /* try next */ }
        }
        try{
          if(!done) localStorage.removeItem(historyKeyFor(u));
          // also clear UI
          if(messages) messages.innerHTML = '';
          addMessage('Chat history cleared.', 'bot');
        }catch(e){ console.warn(e); alert('Failed to clear history'); }
      });
    }
    if(exportBtn){
      exportBtn.addEventListener('click', ()=>{
        const u = getLoggedUser() || 'guest';
        const h = loadHistory(u) || [];
        const dataStr = JSON.stringify({ user: u, exportedAt: new Date().toISOString(), history: h }, null, 2);
        // create a blob and trigger download
        try{
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat_history_${u || 'guest'}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }catch(e){ console.warn(e); alert('Export failed'); }
      });
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", createChatWidget); else createChatWidget();
})();
