import type { Instrument, PricePoint } from "../types";

// Simulated NSE-style feed. Seeded pseudo-random walk so the demo is
// reproducible-ish across a session while still feeling "live" on each tick.

interface Seed {
  symbol: string;
  name: string;
  sector: string;
  base: number;
  avgVolume: number;
  vol: number; // volatility factor
}

const SEEDS: Seed[] = [
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automobile", base: 1042, avgVolume: 9_500_000, vol: 0.012 },
  { symbol: "INFY", name: "Infosys Ltd", sector: "IT Services", base: 1710, avgVolume: 6_200_000, vol: 0.007 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking", base: 1685, avgVolume: 8_800_000, vol: 0.006 },
  { symbol: "ZOMATO", name: "Eternal Ltd (Zomato)", sector: "Consumer Internet", base: 268, avgVolume: 21_000_000, vol: 0.021 },
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genSeries(seed: Seed, points: number, rand: () => number): PricePoint[] {
  const series: PricePoint[] = [];
  let price = seed.base;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const drift = (rand() - 0.48) * seed.vol * price;
    price = Math.max(1, price + drift);
    const volumeSpike = rand() < 0.08 ? 1 + rand() * 2.5 : 1;
    const volume = Math.round(seed.avgVolume / points * (0.6 + rand() * 0.8) * volumeSpike);
    series.push({ t: now - i * 60_000, price: Math.round(price * 100) / 100, volume });
  }
  return series;
}

export function generateInstrument(symbol: string, sessionSeed: number): Instrument {
  const seed = SEEDS.find((s) => s.symbol === symbol);
  if (!seed) throw new Error(`Unknown symbol ${symbol}`);
  const rand = mulberry32(sessionSeed + symbol.charCodeAt(0) * 97);
  const series = genSeries(seed, 30, rand);
  const first = series[0].price;
  const last = series[series.length - 1].price;
  const currentVolume = series.slice(-5).reduce((s, p) => s + p.volume, 0) * 6; // annualize the 5-min window roughly
  return {
    symbol,
    name: seed.name,
    sector: seed.sector,
    ltp: last,
    changePct: Math.round(((last - first) / first) * 10000) / 100,
    avgVolume: seed.avgVolume,
    currentVolume,
    series,
  };
}

export function generateWatchlist(sessionSeed: number): Instrument[] {
  return SEEDS.map((s) => generateInstrument(s.symbol, sessionSeed));
}

export const AVAILABLE_SYMBOLS = SEEDS.map((s) => s.symbol);
