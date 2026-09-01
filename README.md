# AssetPlus — Multi-Agent Financial Intelligence (PS-01 demo scaffold)

A working demo of a multi-agent AI system that turns market signals, regulatory filings, and a user's risk profile into a personalized, cited, explainable investment stance — built with React, TypeScript, Vite, and Groq.

See **ARCHITECTURE.md** for the full design writeup.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Groq

Copy the environment template to a local environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your key:

```env
VITE_GROQ_API_KEY=gsk_your_key_here
```

Get a key at https://console.groq.com/keys.

**Never commit `.env.local` or a real `gsk_...` key to GitHub.** The repository includes `.gitignore` rules that ignore local environment files.

### 3. Start the demo

```bash
npm run dev
```

Open the printed local URL.

## Model connection

For this demo, the frontend calls Groq directly using the local `VITE_GROQ_API_KEY` environment variable.

The request path is:

```text
React → Groq API
```

When the key is missing, the app automatically uses its deterministic rule-based fallback agents.

### Important security note

This setup is **safe to put on public GitHub as long as the real API key is never committed**. However, because Vite exposes `VITE_*` variables to the browser, this is **not suitable for a public production deployment**. Anyone who can use the deployed frontend can inspect the browser and recover the key.

For the demo, keep the real key only in your local `.env.local` file. If you later deploy the application publicly, move the Groq request behind a backend/API route and keep the key there.

If a real key is ever committed to GitHub, revoke it immediately in the Groq console and create a new one.

## Using the demo

1. Pick an investor profile in the left sidebar.
2. Pick a stock from the watchlist.
3. Click **Run pipeline**.
4. The momentum, volume, and sentiment agents run in parallel, followed by retrieval and personalized synthesis.
5. Switch profiles and re-run to see the synthesis change according to risk tolerance, horizon, holdings, and behavioral history.
6. Toggle feed chips to simulate degraded inputs and observe deterministic fallbacks.
7. Scroll down for portfolio concentration and the session performance log.

## Project structure

```text
src/
  types.ts                 shared domain types
  data/                    synthetic market data, documents, and profiles
  services/
    groqClient.ts          Groq chat-completions wrapper
    retrieval.ts           TF-IDF retrieval standing in for a vector DB
    logger.ts              session performance metrics
  agents/
    momentumAgent.ts       momentum signal agent
    volumeAgent.ts         volume signal agent
    sentimentAgent.ts      sentiment signal agent
    ragAgent.ts            retrieval-grounded research agent
    synthesisAgent.ts      personalized final recommendation
  hooks/
    useAgentPipeline.ts    parallel agent orchestration
  components/              dashboard UI
```

## Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — type-check and produce a production build in `dist/`
- `npm run lint` — lint the frontend
- `npm run preview` — serve the production build locally
