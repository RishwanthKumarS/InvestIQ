import type { UserProfile } from "../types";

// In production these would be built from stored order history, survey
// responses, and observed behavior (e.g. panic-selling on drawdowns).
// Here they're pre-baked so the demo can show the SAME market inputs
// producing DIFFERENT agent outputs for different users. Watchlists and
// holdings are also deliberately different per profile — conservative
// sticks to the two lowest-volatility large caps, aggressive adds the
// highest-volatility name — so the sidebar and allocation view actually
// differ by profile instead of just the agent commentary.

export const USER_PROFILES: UserProfile[] = [
  {
    id: "u_conservative",
    name: "Meera R.",
    riskProfile: "conservative",
    horizonMonths: 36,
    maxSingleStockAllocationPct: 8,
    history: [
      "Exited 3 of last 4 positions during >10% drawdowns",
      "Prefers dividend-paying large caps",
      "No F&O activity in the last 12 months",
    ],
    watchlist: ["HDFCBANK", "INFY"],
    holdings: [
      { symbol: "HDFCBANK", qty: 40, avgPrice: 1590 },
      { symbol: "INFY", qty: 20, avgPrice: 1620 },
    ],
  },
  {
    id: "u_moderate",
    name: "Arjun K.",
    riskProfile: "moderate",
    horizonMonths: 18,
    maxSingleStockAllocationPct: 15,
    history: [
      "Holds through 5-10% drawdowns, exits beyond 20%",
      "Mix of large and mid caps, occasional index F&O hedge",
    ],
    watchlist: ["HDFCBANK", "INFY", "TATAMOTORS"],
    holdings: [
      { symbol: "TATAMOTORS", qty: 25, avgPrice: 980 },
      { symbol: "ZOMATO", qty: 150, avgPrice: 210 },
    ],
  },
  {
    id: "u_aggressive",
    name: "Priya S.",
    riskProfile: "aggressive",
    horizonMonths: 6,
    maxSingleStockAllocationPct: 30,
    history: [
      "Active weekly options writer, high turnover",
      "Increases position size after winning streaks",
      "89th percentile portfolio volatility vs peer cohort",
    ],
    watchlist: ["ZOMATO", "TATAMOTORS", "HDFCBANK"],
    holdings: [
      { symbol: "ZOMATO", qty: 400, avgPrice: 250 },
      { symbol: "TATAMOTORS", qty: 60, avgPrice: 1010 },
      { symbol: "HDFCBANK", qty: 10, avgPrice: 1700 },
    ],
  },
];
