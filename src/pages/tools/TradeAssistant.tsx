import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Direction,
  StopType,
  ConfluenceType,
  TradeInputs,
  TradeResult,
  runRuleEngine,
} from '../../utils/tradeCalculator';
import { getTradeSignals, runScan, TradeSignalsResponse, TradeSignal } from '../../api/tradeSignals';
import { getWatchlist, addToWatchlist, removeFromWatchlist, WatchlistSymbol } from '../../api/watchlist';
import { getStockSymbols, refreshStockSymbols, clearLocalCache, StockSymbol } from '../../api/stockSymbols';
import { useAuth } from '../../contexts/AuthContext';
import './TradeAssistant.css';

const DEFAULT_INPUTS: TradeInputs = {
  direction: 'Long',
  entryPrice: 0,
  stopPrice: 0,
  targetPrice: 0,
  accountSize: 0,
  stopType: 'SwingPoint',
  confluenceType: 'AddonEntry',
  macroStructureValid: false,
  breakoutConfirmed: false,
  previousEntryPrice: undefined,
  divergenceAngle: undefined,
};

function hasRequiredPrices(inputs: TradeInputs): boolean {
  return inputs.entryPrice > 0 && inputs.stopPrice > 0 && inputs.targetPrice > 0 && inputs.accountSize > 0;
}

interface StepCardProps {
  label: string;
  detail: string;
  pass: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ label, detail, pass }) => (
  <div className={`step-card ${pass ? 'step-pass' : 'step-fail'}`}>
    <span className="step-icon">{pass ? '✓' : '✗'}</span>
    <div>
      <div className="step-label">{label}</div>
      <div className="step-detail">{detail}</div>
    </div>
  </div>
);

export const TradeAssistant: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'calculator' | 'scanner' | 'watchlist'>('scanner');
  const [inputs, setInputs] = useState<TradeInputs>(DEFAULT_INPUTS);
  const [showJson, setShowJson] = useState(false);

  // Scanner state
  const [scanData, setScanData] = useState<TradeSignalsResponse | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanRunning, setScanRunning] = useState(false);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistSymbol[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [addingSymbol, setAddingSymbol] = useState(false);

  // Symbol browser state
  const [allSymbols, setAllSymbols] = useState<StockSymbol[]>([]);
  const [symbolsLastUpdated, setSymbolsLastUpdated] = useState<number | null>(null);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [symbolsError, setSymbolsError] = useState<string | null>(null);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [browserOpen, setBrowserOpen] = useState(false);
  const [refreshingSymbols, setRefreshingSymbols] = useState(false);

  const loadScanResults = useCallback(async (date?: string) => {
    setScanLoading(true);
    setScanError(null);
    try {
      const data = await getTradeSignals(date);
      setScanData(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to load scan results');
    } finally {
      setScanLoading(false);
    }
  }, []);

  const handleRunScan = useCallback(async () => {
    setScanRunning(true);
    setScanError(null);
    try {
      const result = await runScan();
      console.log(`Scan dispatched: ${result.totalTickers} tickers, runId=${result.scanRunId}`);
      // Refresh results after a short delay to pick up the _META_ processing record
      setTimeout(() => loadScanResults(), 2000);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setScanRunning(false);
    }
  }, [loadScanResults]);

  useEffect(() => {
    if (activeTab === 'scanner' && !scanData) {
      loadScanResults();
    }
    if (activeTab === 'watchlist' && watchlist.length === 0) {
      loadWatchlist();
    }
  }, [activeTab, scanData, loadScanResults]);

  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setWatchlistError(null);
    try {
      const data = await getWatchlist();
      setWatchlist(data.symbols);
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : 'Failed to load watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const handleAddSymbol = useCallback(async () => {
    const symbol = newSymbol.toUpperCase().trim();
    if (!symbol) return;
    setAddingSymbol(true);
    setWatchlistError(null);
    try {
      await addToWatchlist(symbol);
      setNewSymbol('');
      await loadWatchlist();
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : 'Failed to add symbol');
    } finally {
      setAddingSymbol(false);
    }
  }, [newSymbol, loadWatchlist]);

  const handleRemoveSymbol = useCallback(async (symbol: string) => {
    setWatchlistError(null);
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : 'Failed to remove symbol');
    }
  }, []);

  const loadAllSymbols = useCallback(async (force = false) => {
    setSymbolsLoading(true);
    setSymbolsError(null);
    try {
      const data = await getStockSymbols(force);
      setAllSymbols(data.symbols);
      setSymbolsLastUpdated(data.lastUpdated);
    } catch (err) {
      setSymbolsError(err instanceof Error ? err.message : 'Failed to load symbol list');
    } finally {
      setSymbolsLoading(false);
    }
  }, []);

  const handleOpenBrowser = useCallback(() => {
    setBrowserOpen(true);
    if (allSymbols.length === 0) loadAllSymbols();
  }, [allSymbols.length, loadAllSymbols]);

  const handleRefreshSymbols = useCallback(async () => {
    setRefreshingSymbols(true);
    setSymbolsError(null);
    try {
      await refreshStockSymbols();
      clearLocalCache();
      await loadAllSymbols(true);
    } catch (err) {
      setSymbolsError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshingSymbols(false);
    }
  }, [loadAllSymbols]);

  const handleAddSelected = useCallback(async () => {
    if (selectedSymbols.size === 0) return;
    setWatchlistError(null);
    const toAdd = Array.from(selectedSymbols);
    try {
      await Promise.all(toAdd.map(sym => addToWatchlist(sym)));
      setSelectedSymbols(new Set());
      await loadWatchlist();
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : 'Failed to add symbols');
    }
  }, [selectedSymbols, loadWatchlist]);

  const watchlistSymbolSet = useMemo(
    () => new Set(watchlist.map(w => w.symbol)),
    [watchlist]
  );

  const filteredSymbols = useMemo(() => {
    const q = symbolSearch.trim().toUpperCase();
    if (!q) return allSymbols.slice(0, 100); // show first 100 when no search
    return allSymbols.filter(
      s => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 100);
  }, [allSymbols, symbolSearch]);

  function loadCandidateIntoCalculator(signal: TradeSignal) {
    if (!signal.entry || !signal.stop || !signal.target || !signal.direction) return;
    setInputs(prev => ({
      ...prev,
      direction: signal.direction as Direction,
      entryPrice: signal.entry!,
      stopPrice: signal.stop!,
      targetPrice: signal.target!,
      macroStructureValid: true,
      breakoutConfirmed: true,
    }));
    setActiveTab('calculator');
  }

  const result: TradeResult | null = useMemo(() => {
    if (!hasRequiredPrices(inputs)) return null;
    return runRuleEngine(inputs);
  }, [inputs]);

  function setField<K extends keyof TradeInputs>(field: K, value: TradeInputs[K]) {
    setInputs(prev => ({ ...prev, [field]: value }));
  }

  function parsePrice(val: string): number {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }

  const statusClass =
    result?.status === 'BUY' ? 'signal-buy' :
    result?.status === 'SELL' ? 'signal-sell' :
    'signal-hold';

  return (
    <div className="trade-assistant">
      <div className="trade-header">
        <h1>Trade Assistant</h1>
        <p className="trade-subtitle">5BP Breakout Rule Engine</p>
      </div>

      {/* Tab switcher */}
      <div className="trade-tabs">
        <button
          className={`trade-tab ${activeTab === 'scanner' ? 'trade-tab-active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          📡 Scanner
        </button>
        <button
          className={`trade-tab ${activeTab === 'calculator' ? 'trade-tab-active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          🧮 Calculator
        </button>
        {isAdmin && (
          <button
            className={`trade-tab ${activeTab === 'watchlist' ? 'trade-tab-active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            📋 Watchlist
          </button>
        )}
      </div>

      {/* ── SCANNER TAB ── */}
      {activeTab === 'scanner' && (
        <div className="scanner-panel">
          <div className="scanner-header">
            <div>
              {scanData && (
                <p className="scanner-date">
                  Market date: <strong>{scanData.marketDate}</strong>
                  {' · '}
                  <span className={`scan-status scan-status-${scanData.scanStatus}`}>
                    {scanData.scanStatus === 'completed' && '✓ Scan complete'}
                    {scanData.scanStatus === 'processing' && '⏳ Scan in progress'}
                    {scanData.scanStatus === 'failed' && '✗ Scan failed'}
                    {scanData.scanStatus === 'no_data' && 'No scan data yet'}
                  </span>
                  {scanData.scannedAt && (
                    <span className="scanner-time">
                      {' · '}scanned at {new Date(scanData.scannedAt).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              className="scan-refresh-btn"
              onClick={() => loadScanResults()}
              disabled={scanLoading}
            >
              {scanLoading ? '⏳ Loading…' : '↻ Refresh'}
            </button>
            {isAdmin && (
              <button
                className="scan-run-btn"
                onClick={handleRunScan}
                disabled={scanRunning}
                title="Dispatch a scan of the current watchlist"
              >
                {scanRunning ? '⏳ Dispatching…' : '▶ Run Scan Now'}
              </button>
            )}
          </div>

          {scanError && (
            <div className="scan-error">⚠ {scanError}</div>
          )}

          {scanLoading && !scanData && (
            <div className="scan-loading">Loading scan results…</div>
          )}

          {!scanLoading && !scanError && scanData?.scanStatus === 'no_data' && (
            <div className="scan-empty">
              <p>No scan data for today. The scanner runs automatically on market days at 5 PM ET.{isAdmin && ' Or click "Run Scan Now" to trigger it manually.'}</p>
            </div>
          )}

          {scanData && scanData.signals.length > 0 && (
            <>
              {/* Candidates */}
              {scanData.signals.filter(s => s.signalType === 'Candidate').length > 0 && (
                <div className="scan-section">
                  <h3>🟢 Candidates ({scanData.signals.filter(s => s.signalType === 'Candidate').length})</h3>
                  <p className="scan-note">Steps 2.1–2.3 passed. Verify Step 2.4 confluence before trading.</p>
                  <div className="signals-table-wrapper">
                    <table className="signals-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Dir</th>
                          <th>Entry</th>
                          <th>Stop</th>
                          <th>Target</th>
                          <th>RRR</th>
                          <th>Risk%</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanData.signals
                          .filter(s => s.signalType === 'Candidate')
                          .map(signal => (
                            <tr key={signal.symbol} className={signal.direction === 'Long' ? 'row-long' : 'row-short'}>
                              <td className="symbol-cell">{signal.symbol}</td>
                              <td>
                                <span className={`dir-badge ${signal.direction === 'Long' ? 'dir-long' : 'dir-short'}`}>
                                  {signal.direction === 'Long' ? '▲ Long' : '▼ Short'}
                                </span>
                              </td>
                              <td>${signal.entry?.toFixed(2)}</td>
                              <td className="stop-cell">${signal.stop?.toFixed(2)}</td>
                              <td className="target-cell">${signal.target?.toFixed(2)}</td>
                              <td>{signal.rrr?.toFixed(2)}</td>
                              <td>{signal.riskPercent}%</td>
                              <td>
                                <button
                                  className="load-btn"
                                  onClick={() => loadCandidateIntoCalculator(signal)}
                                >
                                  Analyze →
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Filtered — collapsed by default */}
              {scanData.signals.filter(s => s.signalType === 'Filtered').length > 0 && (
                <details className="scan-section scan-filtered">
                  <summary>
                    ⚪ Filtered out ({scanData.signals.filter(s => s.signalType === 'Filtered').length} tickers)
                  </summary>
                  <table className="signals-table filtered-table">
                    <thead>
                      <tr><th>Symbol</th><th>Reason</th></tr>
                    </thead>
                    <tbody>
                      {scanData.signals
                        .filter(s => s.signalType === 'Filtered')
                        .map(signal => (
                          <tr key={signal.symbol}>
                            <td className="symbol-cell">{signal.symbol}</td>
                            <td className="filter-reason">{signal.filterReason}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* ── WATCHLIST TAB ── */}
      {activeTab === 'watchlist' && isAdmin && (
        <div className="watchlist-panel">
          <div className="watchlist-header">
            <h2>Scanner Watchlist</h2>
            <p className="watchlist-subtitle">{watchlist.length} symbol{watchlist.length !== 1 ? 's' : ''} — scanned daily at market close</p>
          </div>

          {watchlistError && (
            <div className="scan-error">⚠ {watchlistError}</div>
          )}

          <div className="watchlist-add-row">
            <input
              className="watchlist-input"
              type="text"
              placeholder="Add symbol (e.g. AAPL)"
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
              maxLength={5}
            />
            <button
              className="watchlist-add-btn"
              onClick={handleAddSymbol}
              disabled={addingSymbol || !newSymbol.trim()}
            >
              {addingSymbol ? '…' : '+ Add'}
            </button>
          </div>

          {watchlistLoading ? (
            <div className="scan-loading">Loading watchlist…</div>
          ) : (
            <div className="watchlist-grid">
              {watchlist.map(({ symbol, addedAt }) => (
                <div key={symbol} className="watchlist-chip">
                  <span className="watchlist-symbol">{symbol}</span>
                  <span className="watchlist-date">{new Date(addedAt).toLocaleDateString()}</span>
                  <button
                    className="watchlist-remove-btn"
                    onClick={() => handleRemoveSymbol(symbol)}
                    title={`Remove ${symbol}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {watchlist.length === 0 && (
                <p className="watchlist-empty">No symbols yet — add some above.</p>
              )}
            </div>
          )}

          {/* ── Symbol Browser ── */}
          <div className="symbol-browser">
            <div className="symbol-browser-header">
              <button className="symbol-browser-toggle" onClick={() => browserOpen ? setBrowserOpen(false) : handleOpenBrowser()}>
                {browserOpen ? '▼' : '▶'} Browse Symbol List
                {allSymbols.length > 0 && <span className="symbol-browser-count">({allSymbols.length.toLocaleString()} symbols)</span>}
              </button>
              {isAdmin && (
                <button
                  className="scan-refresh-btn"
                  onClick={handleRefreshSymbols}
                  disabled={refreshingSymbols}
                  title={symbolsLastUpdated ? `Last updated ${new Date(symbolsLastUpdated).toLocaleDateString()}` : 'Never updated'}
                >
                  {refreshingSymbols ? '⏳ Refreshing…' : '↻ Refresh List'}
                </button>
              )}
            </div>

            {browserOpen && (
              <div className="symbol-browser-body">
                {symbolsError && <div className="scan-error">⚠ {symbolsError}</div>}

                <div className="symbol-search-row">
                  <input
                    className="symbol-search-input"
                    type="text"
                    placeholder="Search by symbol or company name…"
                    value={symbolSearch}
                    onChange={e => setSymbolSearch(e.target.value)}
                    autoFocus
                  />
                  {selectedSymbols.size > 0 && (
                    <button className="watchlist-add-btn" onClick={handleAddSelected}>
                      + Add {selectedSymbols.size} Selected
                    </button>
                  )}
                </div>

                {symbolsLoading ? (
                  <div className="scan-loading">Loading symbols…</div>
                ) : (
                  <>
                    <div className="symbol-list">
                      {filteredSymbols.map(s => {
                        const inWatchlist = watchlistSymbolSet.has(s.symbol);
                        const isChecked = selectedSymbols.has(s.symbol);
                        return (
                          <label
                            key={s.symbol}
                            className={`symbol-row ${inWatchlist ? 'symbol-row-added' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked || inWatchlist}
                              disabled={inWatchlist}
                              onChange={() => {
                                if (inWatchlist) return;
                                setSelectedSymbols(prev => {
                                  const next = new Set(prev);
                                  isChecked ? next.delete(s.symbol) : next.add(s.symbol);
                                  return next;
                                });
                              }}
                            />
                            <span className="symbol-row-ticker">{s.symbol}</span>
                            <span className="symbol-row-name">{s.name}</span>
                            <span className="symbol-row-exchange">{s.exchange}</span>
                            {inWatchlist && <span className="symbol-row-badge">✓ Added</span>}
                          </label>
                        );
                      })}
                    </div>
                    {allSymbols.length > 0 && filteredSymbols.length === 100 && (
                      <p className="symbol-browser-hint">Showing first 100 results — refine your search to narrow down.</p>
                    )}
                    {allSymbols.length === 0 && !symbolsLoading && (
                      <p className="watchlist-empty">No symbol data cached yet. {isAdmin ? 'Click "Refresh List" to load.' : 'Ask an admin to refresh the symbol list.'}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CALCULATOR TAB ── */}
      {activeTab === 'calculator' && (
        <div className="trade-layout">
          {/* ── LEFT: Inputs ── */}
          <div className="trade-inputs-panel">

          {/* Direction */}
          <div className="input-section">
            <label className="section-label">Direction</label>
            <div className="direction-toggle">
              <button
                className={`dir-btn ${inputs.direction === 'Long' ? 'dir-active-long' : ''}`}
                onClick={() => setField('direction', 'Long')}
              >
                ▲ Long
              </button>
              <button
                className={`dir-btn ${inputs.direction === 'Short' ? 'dir-active-short' : ''}`}
                onClick={() => setField('direction', 'Short')}
              >
                ▼ Short
              </button>
            </div>
          </div>

          {/* Prices */}
          <div className="input-section">
            <label className="section-label">Trade Prices</label>
            <div className="price-grid">
              <div className="price-field">
                <label>Entry Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inputs.entryPrice || ''}
                  onChange={e => setField('entryPrice', parsePrice(e.target.value))}
                />
              </div>
              <div className="price-field">
                <label>Stop Loss ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inputs.stopPrice || ''}
                  onChange={e => setField('stopPrice', parsePrice(e.target.value))}
                />
              </div>
              <div className="price-field">
                <label>Target Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inputs.targetPrice || ''}
                  onChange={e => setField('targetPrice', parsePrice(e.target.value))}
                />
              </div>
              <div className="price-field">
                <label>Account Size ($)</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0"
                  value={inputs.accountSize || ''}
                  onChange={e => setField('accountSize', parsePrice(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Stop Type */}
          <div className="input-section">
            <label className="section-label">Stop Type</label>
            <select
              className="trade-select"
              value={inputs.stopType}
              onChange={e => setField('stopType', e.target.value as StopType)}
            >
              <option value="SwingPoint">Swing Point (1.5/1.75 min RRR)</option>
              <option value="BIT1">Back-In-Time — 1 Bar</option>
              <option value="BIT2">Back-In-Time — 2 Bars</option>
              <option value="BIT3Plus">Back-In-Time — 3+ Bars</option>
            </select>
          </div>

          {/* Macro Structure — Step 2.1 */}
          <div className="input-section">
            <label className="section-label">Step 2.1 — Macro Structure</label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={inputs.macroStructureValid}
                onChange={e => setField('macroStructureValid', e.target.checked)}
              />
              Market is trending with a clear Support/Resistance level
            </label>
          </div>

          {/* Breakout — Step 2.2 */}
          <div className="input-section">
            <label className="section-label">Step 2.2 — Breakout Confirmation</label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={inputs.breakoutConfirmed}
                onChange={e => setField('breakoutConfirmed', e.target.checked)}
              />
              5BP breakout confirmed at S/R matching macro trend
            </label>
          </div>

          {/* Confluence — Step 2.4 */}
          <div className="input-section">
            <label className="section-label">Step 2.4 — Confluence Type</label>
            <div className="confluence-toggle">
              <button
                className={`conf-btn ${inputs.confluenceType === 'AddonEntry' ? 'conf-active' : ''}`}
                onClick={() => setField('confluenceType', 'AddonEntry')}
              >
                Addon Entry
              </button>
              <button
                className={`conf-btn ${inputs.confluenceType === 'PDDivergence' ? 'conf-active' : ''}`}
                onClick={() => setField('confluenceType', 'PDDivergence')}
              >
                PD Divergence
              </button>
            </div>

            {inputs.confluenceType === 'AddonEntry' && (
              <div className="price-field" style={{ marginTop: '1rem' }}>
                <label>Previous Entry Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inputs.previousEntryPrice || ''}
                  onChange={e => setField('previousEntryPrice', parsePrice(e.target.value) || undefined)}
                />
              </div>
            )}

            {inputs.confluenceType === 'PDDivergence' && (
              <div className="price-field" style={{ marginTop: '1rem' }}>
                <label>Divergence Angle (°)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="90"
                  placeholder={inputs.direction === 'Long' ? 'Min 45°' : 'Min 65°'}
                  value={inputs.divergenceAngle || ''}
                  onChange={e => setField('divergenceAngle', parsePrice(e.target.value) || undefined)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="trade-results-panel">
          {!result ? (
            <div className="results-placeholder">
              <div className="placeholder-icon">📊</div>
              <p>Enter trade prices and account size to see your analysis.</p>
            </div>
          ) : (
            <>
              {/* Signal Badge */}
              <div className={`signal-badge ${statusClass}`}>
                <span className="signal-status">{result.status}</span>
                <span className="signal-sub">
                  {result.direction} · RRR {result.rrr.toFixed(2)} · Risk {result.riskPercent}%
                </span>
              </div>

              {/* Step Validations */}
              <div className="steps-section">
                <h3>Rule Validation</h3>
                <StepCard {...result.steps.macroStructure} />
                <StepCard {...result.steps.breakoutConfirmation} />
                <StepCard {...result.steps.miniStructure} />
                <StepCard {...result.steps.confluence} />
              </div>

              {/* Trade Parameters */}
              {result.status !== 'HOLD' && (
                <div className="trade-params">
                  <h3>Trade Parameters</h3>
                  <div className="params-grid">
                    <div className="param-item">
                      <span className="param-label">Entry</span>
                      <span className="param-value">${result.tradeParameters.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">Stop Loss</span>
                      <span className="param-value param-stop">${result.tradeParameters.stopPrice.toFixed(2)}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">Target</span>
                      <span className="param-value param-target">${result.tradeParameters.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">RRR</span>
                      <span className="param-value">{result.tradeParameters.calculatedRRR.toFixed(2)}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">Risk %</span>
                      <span className="param-value">{result.tradeParameters.riskPercentage}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">Shares</span>
                      <span className="param-value">{result.tradeParameters.positionShares.toLocaleString()}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">$ at Risk</span>
                      <span className="param-value param-stop">${result.tradeParameters.dollarRisk.toFixed(2)}</span>
                    </div>
                    <div className="param-item">
                      <span className="param-label">Potential Profit</span>
                      <span className="param-value param-target">${result.tradeParameters.potentialProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Output Toggle */}
              <div className="json-section">
                <button className="json-toggle-btn" onClick={() => setShowJson(v => !v)}>
                  {showJson ? 'Hide' : 'Show'} JSON Output
                </button>
                {showJson && (
                  <pre className="json-output">
                    {JSON.stringify({
                      Status: result.status,
                      Timestamp: new Date().toISOString(),
                      Direction: result.direction,
                      Entry_Logic: result.steps.breakoutConfirmation.pass ? '5BP Breakout Confirmed' : 'Breakout Not Confirmed',
                      Trade_Parameters: {
                        Initial_Price: result.tradeParameters.entryPrice,
                        Stop_Loss_Price: result.tradeParameters.stopPrice,
                        Target_Price: result.tradeParameters.targetPrice,
                        Calculated_RRR: parseFloat(result.tradeParameters.calculatedRRR.toFixed(2)),
                        Risk_Percentage: result.tradeParameters.riskPercentage,
                        Position_Shares: result.tradeParameters.positionShares,
                        Dollar_Risk: parseFloat(result.tradeParameters.dollarRisk.toFixed(2)),
                        Potential_Profit: parseFloat(result.tradeParameters.potentialProfit.toFixed(2)),
                      },
                      Action: result.action,
                    }, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default TradeAssistant;
