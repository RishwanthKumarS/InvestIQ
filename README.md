# InvestIQ — Multi-Agent Financial Intelligence

A working demo of a multi-agent AI system that turns market signals, regulatory filings, and a user's risk profile into a personalized, cited, explainable investment stance — built with React, TypeScript, Vite, and Groq.

## What this is

A working scaffold for the multi-agent financial intelligence system described in PS-01, built as a single-page React/TypeScript frontend with direct Groq API calls for a lightweight demo, so the full reasoning chain — from raw signals to a personalized, cited recommendation — is visible and inspectable in one screen. It substitutes synthetic market data and a small synthetic document corpus for live NSE/SEBI feeds so it remains easy to run locally, while keeping market data, retrieval, and LLM calls behind narrow interfaces that production integrations can replace.

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

## Architecture & decision logic

### Agent architecture

Five agents, each with a single responsibility and a typed output contract:

| Agent | Role | Input | Output contract |
|---|---|---|---|
| Momentum Analyst | classify short vs long window price momentum | pre-computed technical stats (5-period vs 30-period average, period return) | `SignalOutput` — label, confidence, cited reasoning |
| Volume Anomaly Analyst | classify current volume vs 30-day average | volume ratio | `SignalOutput` |
| Sentiment Analyst | classify institutional/management tone | top-k retrieved filing/transcript excerpts | `SignalOutput` |
| Retrieval agent (RAG) | answer a research question grounded in the document corpus | retrieved chunks with doc IDs | `RagOutput` — answer with inline `[D#]` citations, chunks with attribution and match score |
| Synthesis agent | turn signals + grounded research + user profile into one personalized stance | all of the above + the selected investor's risk profile and behavioral history | `SynthesisOutput` — stance, confidence, summary, cited sources, personalization note |

**Parallel dispatch.** The three signal agents (momentum, volume, sentiment) run concurrently via `Promise.all` in `useAgentPipeline.ts` — they have no dependency on each other. The retrieval agent runs next (it's independent of the signal agents but currently sequenced after them for clarity in the UI trace), and the synthesis agent runs last because it explicitly depends on every other agent's output plus the user profile — it never sees raw market data directly, only the structured outputs above it, which forces it to justify itself in terms the person can audit.

**Why personalization is real, not cosmetic.** The synthesis prompt is given the user's risk profile, horizon, max single-stock allocation, and behavioral history (e.g. "exited 3 of last 4 positions during drawdowns"), and is explicitly instructed that the same market inputs should produce different stances for a conservative long-horizon user versus an aggressive short-horizon user. Switching the profile in the sidebar and re-running the pipeline on the same stock demonstrates this directly.

### Retrieval-augmented generation

`src/data/documentCorpus.ts` holds a small set of synthetic SEBI filings, earnings-call transcripts, and FII/DII flow disclosures, chunked and tagged per symbol. `src/services/retrieval.ts` implements a TF-IDF cosine scorer over that corpus — a stand-in for a real vector database — with the same input/output contract (`query in, scored chunks out`) that a production embeddings + ANN index (e.g. pgvector, Qdrant, Pinecone) would expose. The sentiment agent and the RAG agent both call this layer and receive doc IDs, sources, and match scores, which are rendered with attribution in the UI (`chunk row` list under "Retrieval-grounded research"). The RAG agent's system prompt requires inline `[D#]` citations and explicitly forbids inventing facts not present in the retrieved excerpts.

### Explainability

Every agent output carries its reasoning in plain language, cites the specific numbers or documents it used, and reports a confidence level. The "Full reasoning trace" panel lists every agent call in a run in order with latency and degraded status, so a judge (or a user) can see not just the final recommendation but the exact chain that produced it.

### Graceful degradation

Each signal agent and the RAG agent has a deterministic, rule-based fallback path:

- If the Groq call fails or returns invalid JSON, the agent falls back to threshold-based rules computed from the same input statistics, and marks its output `degraded: true`.
- The UI exposes four toggles ("Drop price feed", "Drop volume feed", "Drop sentiment feed", "Drop filings corpus") that force this fallback path per agent, so the degraded-data handling requirement can be demonstrated on demand rather than waiting for a real outage.
- Degradation never produces an uncited or fabricated output: the momentum/volume fallbacks cite the numeric ratios they used, the sentiment/RAG fallbacks explicitly say "no relevant documents" or "reasoning unavailable" rather than guessing, and the synthesis agent lowers its confidence and states which inputs were degraded.
- The pipeline always completes and returns a result — a degraded agent never throws past its own boundary and never blocks the rest of the pipeline.

### Personalization mechanism

`src/data/userProfiles.ts` defines three profiles (conservative / moderate / aggressive) with distinct risk parameters and behavioral history. `computeConcentrationScore` in `src/services/logger.ts` derives a live portfolio concentration metric from each profile's holdings and current prices, feeding both the Portfolio panel and the performance log.

### Performance logging

`src/services/logger.ts` persists three metrics per pipeline run to `localStorage`, scoped to a session ID: total agent latency, mean signal-agent confidence, and portfolio concentration score, plus a count of degraded events. The "Session performance log" panel renders the running history.

### What's synthetic vs. what's a real integration point

| Layer | This scaffold | Swap in for production |
|---|---|---|
| Market data | `src/data/marketData.ts`, seeded pseudo-random walk | NSE/broker live feed (WebSocket) |
| Document corpus | `src/data/documentCorpus.ts`, 12 hand-written excerpts | SEBI filings + earnings transcript ingestion pipeline |
| Retrieval | `src/services/retrieval.ts`, TF-IDF cosine | Embeddings model + vector DB (pgvector/Qdrant/Pinecone) |
| LLM reasoning | Groq (`llama-3.3-70b-versatile`) called from the browser for the demo | For production, move the call behind a backend/API route so the key never reaches the browser |
| Persistence | `localStorage` | A real database keyed by user ID |