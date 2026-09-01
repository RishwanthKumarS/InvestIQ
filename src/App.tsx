import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { Widget } from "./components/Widget";
import { InstrumentHeader } from "./components/InstrumentHeader";
import { SignalCard } from "./components/SignalCard";
import { RagPanel } from "./components/RagPanel";
import { SynthesisPanel } from "./components/SynthesisPanel";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { AllocationPanel } from "./components/AllocationPanel";
import { PerformanceLog } from "./components/PerformanceLog";
import { ReasoningTrace } from "./components/ReasoningTrace";
import { generateWatchlist } from "./data/marketData";
import { USER_PROFILES } from "./data/userProfiles";
import { isBackendConnected } from "./services/groqClient";
import { readLog } from "./services/logger";
import {
  useAgentPipeline,
  NO_DEGRADATION,
  type DegradedFlags,
} from "./hooks/useAgentPipeline";

const SESSION_SEED = Date.now();

export default function App() {
  const [instruments] = useState(() =>
    generateWatchlist(SESSION_SEED)
  );

  const [selectedProfileId, setSelectedProfileId] = useState(
    USER_PROFILES[0].id
  );

  const [selectedSymbol, setSelectedSymbol] = useState(
    USER_PROFILES[0].watchlist[0]
  );

  const [connected, setConnected] = useState(false);

  const [degradedFlags, setDegradedFlags] =
    useState<DegradedFlags>(NO_DEGRADATION);

  const [perfLog, setPerfLog] = useState(() => readLog());

  const { run, running, result, error } = useAgentPipeline();

  useEffect(() => {
    let cancelled = false;

    isBackendConnected().then((value) => {
      if (!cancelled) {
        setConnected(value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const instrument = useMemo(
    () =>
      instruments.find((i) => i.symbol === selectedSymbol) ??
      instruments[0],
    [instruments, selectedSymbol]
  );

  const profile = useMemo(
    () =>
      USER_PROFILES.find((p) => p.id === selectedProfileId) ??
      USER_PROFILES[0],
    [selectedProfileId]
  );

  const priceMap = useMemo(
    () =>
      Object.fromEntries(
        instruments.map((i) => [i.symbol, i.ltp])
      ),
    [instruments]
  );

  function handleSelectProfile(id: string) {
    setSelectedProfileId(id);

    const next = USER_PROFILES.find((p) => p.id === id);

    if (
      next &&
      !next.watchlist.includes(selectedSymbol)
    ) {
      setSelectedSymbol(next.watchlist[0]);
    }
  }

  async function handleRun() {
    await run(
      instrument,
      profile,
      priceMap,
      degradedFlags
    );

    setPerfLog(readLog());
  }

  function toggleDegraded(key: keyof DegradedFlags) {
    setDegradedFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  const allocationWidget = (
    <Widget title="Allocation" meta={profile.name}>
      <AllocationPanel
        profile={profile}
        instruments={instruments}
      />
    </Widget>
  );

  const hasResult =
    result && result.symbol === selectedSymbol;

  return (
    <div className="app-shell">
      <Sidebar
        instruments={instruments}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        selectedProfileId={selectedProfileId}
        onSelectProfile={handleSelectProfile}
      />

      <main className="main">
        <div className="topbar">
          <span className="topbar-title">
            Research desk
          </span>

          <div
            className="key-status"
            title={
              connected
                ? "Live model reasoning"
                : "Rule-based fallback reasoning"
            }
          >
            <span
              className={`dot ${
                connected ? "ok" : "warn"
              }`}
            />

            {connected
              ? "AI connected"
              : "AI offline · fallback"}
          </div>
        </div>

        <InstrumentHeader
          instrument={instrument}
          running={running}
          degradedFlags={degradedFlags}
          onToggleDegraded={toggleDegraded}
          onRun={handleRun}
        />

        {error && (
          <div className="error-banner">
            Pipeline error: {error}
          </div>
        )}

        <div className="dashboard">
          {hasResult ? (
            <>
              <Widget
                title="Signal agents"
                span={2}
              >
                <div className="signal-grid">
                  {result.signals.map((s) => (
                    <SignalCard
                      key={s.dimension}
                      signal={s}
                    />
                  ))}
                </div>
              </Widget>

              <Widget
                title="Personalized call"
                meta={profile.name}
              >
                <SynthesisPanel
                  synthesis={result.synthesis}
                />
              </Widget>

              {allocationWidget}

              <Widget title="Cited research">
                <RagPanel rag={result.rag} />
              </Widget>

              <Widget title="Reasoning trace">
                <ReasoningTrace result={result} />
              </Widget>
            </>
          ) : (
            <>
              <Widget title="Run the pipeline">
                <div className="empty-state">
                  {running
                    ? "Signal agents are running…"
                    : "Pick a stock on the left, then run the pipeline to see agent signals, cited research, and a personalized call."}
                </div>
              </Widget>

              {allocationWidget}
            </>
          )}

          <Widget
            title="Holdings"
            meta={profile.name}
            span={2}
          >
            <PortfolioPanel
              profile={profile}
              instruments={instruments}
            />
          </Widget>

          <Widget
            title="Session log"
            span={2}
          >
            <PerformanceLog entries={perfLog} />
          </Widget>
        </div>

        <p className="footnote">
          Demo scaffold · synthetic market data and filings.
        </p>
      </main>
    </div>
  );
}