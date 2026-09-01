import type { Instrument, PerformanceMetricSet } from "../types";

const STORAGE_KEY = "assetplus_perf_log";
const SESSION_KEY = "assetplus_session_id";

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function logMetrics(metrics: PerformanceMetricSet) {
  const existing = readLog();
  existing.push(metrics);
  // keep the log bounded for a demo session
  const trimmed = existing.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function readLog(): PerformanceMetricSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PerformanceMetricSet[]) : [];
  } catch {
    return [];
  }
}

export function clearLog() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Simple concentration score: share of portfolio value in the largest single holding, 0-1. */
export function computeConcentrationScore(
  holdings: { symbol: string; qty: number; avgPrice: number }[],
  currentPrices: Record<string, number>,
): number {
  if (holdings.length === 0) return 0;
  const values = holdings.map((h) => h.qty * (currentPrices[h.symbol] ?? h.avgPrice));
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const max = Math.max(...values);
  return Math.round((max / total) * 1000) / 1000;
}

export interface SectorSlice {
  sector: string;
  value: number;
  pct: number; // 0-1 share of total portfolio value
}

/** Groups holdings by instrument sector and returns each sector's share of total portfolio value, largest first. */
export function computeSectorAllocation(
  holdings: { symbol: string; qty: number; avgPrice: number }[],
  instruments: Instrument[],
): SectorSlice[] {
  if (holdings.length === 0) return [];
  const sectorBySymbol = Object.fromEntries(instruments.map((i) => [i.symbol, i.sector]));
  const priceBySymbol = Object.fromEntries(instruments.map((i) => [i.symbol, i.ltp]));

  const totals = new Map<string, number>();
  for (const h of holdings) {
    const sector = sectorBySymbol[h.symbol] ?? "Other";
    const value = h.qty * (priceBySymbol[h.symbol] ?? h.avgPrice);
    totals.set(sector, (totals.get(sector) ?? 0) + value);
  }

  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...totals.entries()]
    .map(([sector, value]) => ({ sector, value, pct: Math.round((value / total) * 1000) / 1000 }))
    .sort((a, b) => b.value - a.value);
}
