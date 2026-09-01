// Synthetic document corpus standing in for SEBI filings, earnings call transcripts,
// and exchange disclosures. In a production build this would be ingested from
// NSE/SEBI feeds into a real vector database (e.g. pgvector, Pinecone, Qdrant).
// Here each doc is pre-chunked so the retrieval layer has something realistic
// to score against without needing an external embeddings API.

export interface CorpusDoc {
  id: string;
  title: string;
  source: string;
  symbol: string;
  date: string;
  text: string;
}

export const DOCUMENT_CORPUS: CorpusDoc[] = [
  {
    id: "D1",
    title: "Q1 FY26 Earnings Call Transcript — Management Commentary",
    source: "Earnings Transcript",
    symbol: "TATAMOTORS",
    date: "2026-07-18",
    text: "Management noted that JLR volumes grew 9% YoY driven by Range Rover and Defender order books, while domestic CV margins compressed 80bps on discounting ahead of the festive season. Management flagged elevated input costs from battery-grade lithium and reiterated a net-debt-free target by FY27, contingent on EV ramp-up capex staying within guided bounds.",
  },
  {
    id: "D2",
    title: "SEBI Corporate Filing — Related Party Transaction Disclosure",
    source: "SEBI Filing",
    symbol: "TATAMOTORS",
    date: "2026-06-30",
    text: "The company disclosed a related party transaction with a group entity for supply of automotive components valued at approximately INR 210 crore for the quarter, within the omnibus approval limit set by the audit committee. No material adverse impact on minority shareholder interest was identified by the audit committee.",
  },
  {
    id: "D3",
    title: "FII/DII Flow Disclosure Summary",
    source: "Exchange Flow Data",
    symbol: "TATAMOTORS",
    date: "2026-08-29",
    text: "Foreign institutional investors were net sellers of INR 340 crore in the auto sector over the trailing five sessions, while domestic institutions absorbed a large share of the selling with net buying of INR 410 crore, concentrated in commercial vehicle and EV-adjacent names.",
  },
  {
    id: "D4",
    title: "Q1 FY26 Earnings Call Transcript — Analyst Q&A",
    source: "Earnings Transcript",
    symbol: "INFY",
    date: "2026-07-14",
    text: "In response to analyst questions on deal pipeline, management said large-deal TCV for the quarter stood at $2.6 billion, with generative AI-linked engagements now contributing a low double-digit share of new bookings. Management guided FY26 revenue growth to the lower half of the 3-5% constant currency band, citing continued discretionary spend caution in BFSI clients in North America.",
  },
  {
    id: "D5",
    title: "SEBI Corporate Filing — Buyback Announcement",
    source: "SEBI Filing",
    symbol: "INFY",
    date: "2026-04-11",
    text: "The board approved a share buyback of up to INR 18,000 crore at a price not exceeding INR 1,850 per share via the open market route, subject to shareholder approval, representing approximately 2.3% of total paid-up equity capital.",
  },
  {
    id: "D6",
    title: "Sell-Side Analyst Note — Sector Outlook",
    source: "Analyst Note",
    symbol: "INFY",
    date: "2026-08-20",
    text: "The brokerage maintained a neutral stance citing muted discretionary IT spend, but flagged that current valuations already price in weak near-term growth, with limited further downside absent a fresh demand shock. Currency tailwinds from a weaker rupee were noted as a partial offset to margin pressure.",
  },
  {
    id: "D7",
    title: "Q1 FY26 Earnings Call Transcript — Management Commentary",
    source: "Earnings Transcript",
    symbol: "HDFCBANK",
    date: "2026-07-19",
    text: "Management indicated net interest margins stabilised sequentially at 3.4% as the deposit repricing cycle nears completion, while gross NPA ratio improved marginally to 1.24%. Management guided for loan growth to track nominal GDP growth over the next two quarters as the balance sheet merger integration effects fade.",
  },
  {
    id: "D8",
    title: "SEBI Corporate Filing — Credit Rating Reaffirmation",
    source: "SEBI Filing",
    symbol: "HDFCBANK",
    date: "2026-05-02",
    text: "A leading domestic credit rating agency reaffirmed the long-term rating at the highest safety grade with a stable outlook, citing strong capitalisation, a granular retail deposit franchise, and comfortable liquidity coverage well above regulatory minimums.",
  },
  {
    id: "D9",
    title: "FII/DII Flow Disclosure Summary",
    source: "Exchange Flow Data",
    symbol: "HDFCBANK",
    date: "2026-08-28",
    text: "Banking stocks saw net FII inflows of INR 890 crore over the past week, the strongest weekly pace in two months, coinciding with expectations of a policy rate pause and improved system liquidity conditions.",
  },
  {
    id: "D10",
    title: "Sell-Side Analyst Note — Company Update",
    source: "Analyst Note",
    symbol: "ZOMATO",
    date: "2026-08-15",
    text: "The brokerage flagged rising competitive intensity in quick commerce as dark-store expansion by rivals accelerates, likely pressuring near-term contribution margins even as gross order value growth remains healthy above 30% YoY.",
  },
  {
    id: "D11",
    title: "SEBI Corporate Filing — Investor Presentation Excerpt",
    source: "SEBI Filing",
    symbol: "ZOMATO",
    date: "2026-07-25",
    text: "The company disclosed that quick commerce adjusted EBITDA margin as a percentage of GOV improved to negative 1.1% from negative 1.9% in the prior quarter, attributing the gain to network densification and lower discounting intensity in mature cities, partly offset by new city launch costs.",
  },
  {
    id: "D12",
    title: "FII/DII Flow Disclosure Summary",
    source: "Exchange Flow Data",
    symbol: "ZOMATO",
    date: "2026-08-27",
    text: "Consumer internet names saw mixed institutional flows, with FIIs trimming positions by INR 120 crore even as domestic mutual funds added INR 95 crore, reflecting a divergence in near-term versus structural growth views.",
  },
];

export function getDocsForSymbol(symbol: string): CorpusDoc[] {
  return DOCUMENT_CORPUS.filter((d) => d.symbol === symbol);
}
