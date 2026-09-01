// Shared domain types for the multi-agent financial intelligence demo.

export type Dimension = "momentum" | "volume" | "sentiment";

export interface PricePoint {
  t: number; // unix ms
  price: number;
  volume: number;
}

export interface Instrument {
  symbol: string;
  name: string;
  sector: string;
  ltp: number; // last traded price
  changePct: number;
  avgVolume: number;
  currentVolume: number;
  series: PricePoint[]; // recent synthetic tick history
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface SignalOutput {
  dimension: Dimension;
  label: string; // e.g. "Bullish momentum breakout"
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-1
  reasoning: string; // model-generated, cited to the numbers it used
  degraded?: boolean; // true if this agent had to fall back due to missing data
  latencyMs: number;
}

export interface RetrievedChunk {
  docId: string;
  title: string;
  source: string;
  snippet: string;
  score: number;
}

export interface RagOutput {
  query: string;
  chunks: RetrievedChunk[];
  answer: string; // grounded answer citing chunk ids inline as [D1], [D2]...
  latencyMs: number;
  degraded?: boolean;
}

export type RiskProfile = "conservative" | "moderate" | "aggressive";

export interface UserProfile {
  id: string;
  name: string;
  riskProfile: RiskProfile;
  horizonMonths: number;
  maxSingleStockAllocationPct: number;
  history: string[]; // short behavioral notes, e.g. "sold on 3 of last 4 drawdowns"
  watchlist: string[];
  holdings: { symbol: string; qty: number; avgPrice: number }[];
}

export interface SynthesisOutput {
  symbol: string;
  stance: "Buy" | "Hold" | "Reduce" | "Avoid";
  confidenceScore: number;
  summary: string;
  citedSources: string[]; // doc ids / agent dimensions referenced
  personalizationNote: string; // how this user's profile changed the call
  latencyMs: number;
}

export interface PerformanceMetricSet {
  sessionId: string;
  symbol: string;
  timestamp: number;
  agentLatencyMs: number; // total pipeline latency
  avgSignalConfidence: number; // mean confidence across the 3 signal agents
  portfolioConcentrationScore: number; // 0-1, higher = more concentrated risk
  degradedEvents: number;
}

export interface PipelineRunResult {
  symbol: string;
  timestamp: number;
  signals: SignalOutput[];
  rag: RagOutput;
  synthesis: SynthesisOutput;
  metrics: PerformanceMetricSet;
  degraded: boolean;
  degradedReason?: string;
}
