import type { Instrument, UserProfile } from "../types";

interface Props {
  profile: UserProfile;
  instruments: Instrument[];
}

export function PortfolioPanel({ profile, instruments }: Props) {
  const priceMap = Object.fromEntries(instruments.map((i) => [i.symbol, i.ltp]));

  return (
    <table className="holdings-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Qty</th>
          <th>Avg price</th>
          <th>LTP</th>
          <th>P&amp;L</th>
        </tr>
      </thead>
      <tbody>
        {profile.holdings.map((h) => {
          const ltp = priceMap[h.symbol] ?? h.avgPrice;
          const pnl = (ltp - h.avgPrice) * h.qty;
          return (
            <tr key={h.symbol}>
              <td>{h.symbol}</td>
              <td>{h.qty}</td>
              <td>₹{h.avgPrice.toFixed(2)}</td>
              <td>₹{ltp.toFixed(2)}</td>
              <td className={pnl >= 0 ? "up" : "down"}>
                {pnl >= 0 ? "+" : ""}
                ₹{pnl.toFixed(0)}
              </td>
            </tr>
          );
        })}
        {profile.holdings.length === 0 && (
          <tr>
            <td colSpan={5} className="perf-empty">
              No holdings for this profile.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
