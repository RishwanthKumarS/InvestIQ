# Architecture & Decision Logic — PS-01 Demo Scaffold

## What this is

A working scaffold for the multi-agent financial intelligence system described in PS-01, built as a
single-page React/TypeScript frontend with direct Groq API calls for a lightweight demo, so the full reasoning chain — from raw signals to a personalized, cited recommendation — is visible and inspectable in one screen. It substitutes synthetic market data and a small synthetic document corpus for live NSE/SEBI feeds so it remains easy to run locally, while keeping market data, retrieval, and LLM calls behind narrow interfaces that production integrations can replace.

## Agent architecture

Five agents, each with a single responsibility and a typed output contract:

| Agent | Role | Input | Output contract |
|---|---|---|---|
| Momentum Analyst | classify short vs long window price momentum | pre-computed technical stats (5-period vs 30-period average, period return) | `SignalOutput` — label, confidence, cited reasoning |
| Volume Anomaly Analyst | classify current volume vs 30-day average | volume ratio | `SignalOutput` |
| Sentiment Analyst | classify institutional/management tone | top-k retrieved filing/transcript excerpts | `SignalOutput` |
| Retrieval agent (RAG) | answer a research question grounded in the document corpus | retrieved chunks with doc IDs | `RagOutput` — answer with inline `[D#]` citations, chunks with attribution and match score |
| Synthesis agent | turn signals + grounded research + user profile into one personalized stance | all of the above + the selected investor's risk profile and behavioral history | `SynthesisOutput` — stance, confidence, summary, cited sources, personalization note |

**Parallel dispatch.** The three signal agents (momentum, volume, sentiment) run concurrently via
`Promise.all` in `useAgentPipeline.ts` — they have no dependency on each other. The retrieval agent
runs next (it's independent of the signal agents but currently sequenced after them for clarity in the
UI trace), and the synthesis agent runs last because it explicitly depends on every other agent's
output plus the user profile — it never sees raw market data directly, only the structured outputs
above it, which forces it to justify itself in terms the person can audit.

**Why personalization is real, not cosmetic.** The synthesis prompt is given the user's risk profile,
horizon, max single-stock allocation, and behavioral history (e.g. "exited 3 of last 4 positions during
drawdowns"), and is explicitly instructed that the same market inputs should produce different stances
for a conservative long-horizon user versus an aggressive short-horizon user. Switching the profile in
the sidebar and re-running the pipeline on the same stock demonstrates this directly.

## Retrieval-augmented generation

`src/data/documentCorpus.ts` holds a small set of synthetic SEBI filings, earnings-call transcripts,
and FII/DII flow disclosures, chunked and tagged per symbol. `src/services/retrieval.ts` implements a
TF-IDF cosine scorer over that corpus — a stand-in for a real vector database — with the same
input/output contract (`query in, scored chunks out`) that a production embeddings + ANN index (e.g.
pgvector, Qdrant, Pinecone) would expose. The sentiment agent and the RAG agent both call this layer
and receive doc IDs, sources, and match scores, which are rendered with attribution in the UI (`chunk
row` list under "Retrieval-grounded research"). The RAG agent's system prompt requires inline `[D#]`
citations and explicitly forbids inventing facts not present in the retrieved excerpts.

## Explainability

Every agent output carries its reasoning in plain language, cites the specific numbers or documents it
used, and reports a confidence level. The "Full reasoning trace" panel lists every agent call in a run
in order with latency and degraded status, so a judge (or a user) can see not just the final
recommendation but the exact chain that produced it.

## Graceful degradation

Each signal agent and the RAG agent has a deterministic, rule-based fallback path:

- If the Groq call fails or returns invalid JSON, the agent falls back to threshold-based rules
  computed from the same input statistics, and marks its output `degraded: true`.
- The UI exposes four toggles ("Drop price feed", "Drop volume feed", "Drop sentiment feed", "Drop
  filings corpus") that force this fallback path per agent, so the degraded-data handling requirement
  can be demonstrated on demand rather than waiting for a real outage.
- Degradation never produces an uncited or fabricated output: the momentum/volume fallbacks cite the
  numeric ratios they used, the sentiment/RAG fallbacks explicitly say "no relevant documents" or
  "reasoning unavailable" rather than guessing, and the synthesis agent lowers its confidence and
  states which inputs were degraded.
- The pipeline always completes and returns a result — a degraded agent never throws past its own
  boundary and never blocks the rest of the pipeline.

## Personalization mechanism

`src/data/userProfiles.ts` defines three profiles (conservative / moderate / aggressive) with
distinct risk parameters and behavioral history. `computeConcentrationScore` in
`src/services/logger.ts` derives a live portfolio concentration metric from each profile's holdings
and current prices, feeding both the Portfolio panel and the performance log.

## Performance logging

`src/services/logger.ts` persists three metrics per pipeline run to `localStorage`, scoped to a
session ID: total agent latency, mean signal-agent confidence, and portfolio concentration score,
plus a count of degraded events. The "Session performance log" panel renders the running history.

## What's synthetic vs. what's a real integration point

| Layer | This scaffold | Swap in for production |
|---|---|---|
| Market data | `src/data/marketData.ts`, seeded pseudo-random walk | NSE/broker live feed (WebSocket) |
| Document corpus | `src/data/documentCorpus.ts`, 12 hand-written excerpts | SEBI filings + earnings transcript ingestion pipeline |
| Retrieval | `src/services/retrieval.ts`, TF-IDF cosine | Embeddings model + vector DB (pgvector/Qdrant/Pinecone) |
| LLM reasoning | Groq (`llama-3.3-70b-versatile`) called from the browser for the demo | For production, move the call behind a backend/API route so the key never reaches the browser |
| Persistence | `localStorage` | A real database keyed by user ID |

## Known limitations of the demo

- Groq is called directly from the browser using `VITE_GROQ_API_KEY`. This is acceptable for a local/demo setup, but the key is exposed to anyone using a deployed frontend.
- The real key must stay in a local `.env.local` file and must never be committed to GitHub. For production, route Groq calls through a backend/API route and keep the key server-side.
- "Confidence" is model-reported (or rule-derived in fallback), not backtested against realized
  forward returns — a real performance log would need historical outcome tracking to validate
  signal accuracy over time, which the performance-log schema is designed to accept but this demo
  does not populate with historical data.
- Retrieval is keyword/TF-IDF based rather than semantic embeddings, so it will miss paraphrased
  matches that a real embedding model would catch.
