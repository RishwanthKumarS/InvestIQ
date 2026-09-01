import type { Instrument, UserProfile } from "../types";
import { USER_PROFILES } from "../data/userProfiles";

interface Props {
  instruments: Instrument[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
}

export function Sidebar({ instruments, selectedSymbol, onSelectSymbol, selectedProfileId, onSelectProfile }: Props) {
  const currentProfile = USER_PROFILES.find((p) => p.id === selectedProfileId) ?? USER_PROFILES[0];
  const watchlist = instruments.filter((i) => currentProfile.watchlist.includes(i.symbol));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          Invest<em>IQ</em>
        </div>
        <div className="brand-sub">AI research desk</div>
      </div>

      <div>
        <div className="side-section-title">Profile</div>
        <div className="profile-list">
          {USER_PROFILES.map((p: UserProfile) => (
            <button
              key={p.id}
              className={`profile-row ${p.id === selectedProfileId ? "active" : ""}`}
              onClick={() => onSelectProfile(p.id)}
            >
              <span className="profile-row-name">{p.name}</span>
              <span className="profile-row-meta">
                {p.riskProfile} · {p.horizonMonths}mo · max {p.maxSingleStockAllocationPct}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="side-section-title">Watchlist</div>
        <div className="watchlist">
          {watchlist.map((inst) => (
            <button
              key={inst.symbol}
              className={`watch-row ${inst.symbol === selectedSymbol ? "active" : ""}`}
              onClick={() => onSelectSymbol(inst.symbol)}
            >
              <span className="watch-symbol">{inst.symbol}</span>
              <span className="watch-price mono">₹{inst.ltp.toFixed(2)}</span>
              <span className="watch-sector">{inst.sector}</span>
              <span className={`watch-change mono ${inst.changePct >= 0 ? "up" : "down"}`}>
                {inst.changePct >= 0 ? "+" : ""}
                {inst.changePct.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">Demo data · synthetic prices &amp; filings</div>
    </aside>
  );
}
