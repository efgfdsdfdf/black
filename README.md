
Black PWA + Server README
=========================

Server (Node) setup (example)
-----------------------------
1. Install dependencies:
   npm install

2. Generate VAPID keys (for Web Push):
   npx web-push generate-vapid-keys
   (or use a small node script to generate them)

   This prints a public/private pair. Set them in your environment:
   export VAPID_PUBLIC="YOUR_PUBLIC_KEY"
   export VAPID_PRIVATE="YOUR_PRIVATE_KEY"
   # Create a .env file in this folder with:
   # OPENAI_API_KEY=sk-...
   # PORT=5000

3. Start server:
   npm start
   (the server will run on the port defined in .env or 3000 by default)

Health & test endpoints
- GET /health  -> returns {ok:true}
- POST /chat  -> accepts { message: '...' } and returns { reply: '...' }

Example test (PowerShell):
  curl http://localhost:5000/health
  curl -Method POST http://localhost:5000/chat -Body (ConvertTo-Json @{message='Hello'}) -ContentType 'application/json'

Endpoints:
- POST /api/chat  { message: "..." }  -> proxies to OpenAI using server OPENAI_API_KEY (response is raw OpenAI JSON)
- POST /subscribe { subscription: {...} } -> saves subscription for demo
- POST /push      { title, message } -> sends push to saved subscriptions (requires VAPID keys)

Security note: Do NOT put your OpenAI key in client-side code for production. Use server-side proxy.

Stop tracking .env in Git (recommended)
- From repository root:
   git rm --cached "first code/server/.env"
   git commit -m "stop tracking server .env"

If the key was committed and pushed, consider using BFG or git-filter-repo to remove it from history and then rotate the key.

