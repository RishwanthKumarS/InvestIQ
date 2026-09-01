import type { Instrument, UserProfile } from "../types";
import { computeConcentrationScore, computeSectorAllocation } from "../services/logger";
import { SectorRing } from "./SectorRing";

interface Props {
  profile: UserProfile;
  instruments: Instrument[];
}

export function AllocationPanel({ profile, instruments }: Props) {
  const priceMap = Object.fromEntries(instruments.map((i) => [i.symbol, i.ltp]));
  const concentration = computeConcentrationScore(profile.holdings, priceMap);
  const sectors = computeSectorAllocation(profile.holdings, instruments);

  return (
    <div className="allocation-panel">
      <SectorRing sectors={sectors} />
      <div className="concentration-row">
        <span className="concentration-value mono">{Math.round(concentration * 100)}%</span>
        <span className="concentration-label">
          in top holding
          <br />
          cap {profile.maxSingleStockAllocationPct}%
        </span>
      </div>
    </div>
  );
}
