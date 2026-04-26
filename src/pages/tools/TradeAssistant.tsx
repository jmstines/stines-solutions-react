import React, { useState, useMemo } from 'react';
import {
  Direction,
  StopType,
  ConfluenceType,
  TradeInputs,
  TradeResult,
  runRuleEngine,
} from '../../utils/tradeCalculator';
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
  const [inputs, setInputs] = useState<TradeInputs>(DEFAULT_INPUTS);
  const [showJson, setShowJson] = useState(false);

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
        <p className="trade-subtitle">5BP Breakout Rule Engine — Phase 1 Calculator</p>
      </div>

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
    </div>
  );
};

export default TradeAssistant;
