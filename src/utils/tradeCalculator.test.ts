/**
 * Tests for tradeCalculator.ts
 *
 * Entry prices are sourced from the historical trade log (Trade Log - Stocks.csv).
 * Stop and target prices are derived to produce specific RRR values that exercise
 * each rule-engine branch and boundary condition.
 *
 * CSV trades referenced:
 *   WMT  - entry $58.98   (Long,  10/19/2015)
 *   AMZN - entry $496.08  (Long,  2/11/2016)
 *   AMD  - entry $2.32    (Long,  3/3/2016)
 *   NFLX - entry $98.18   (Long,  3/10/2016)
 *   GPRO - entry $11.69   (Long,  3/29/2016)
 *   AAPL - entry $103.91  (Long,  3/15/2016)
 *   MSFT - entry $50.00   (Long,  6/14/2016)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRRR,
  getRiskPercent,
  getPositionSize,
  validateMiniStructure,
  validateConfluence,
  runRuleEngine,
  TradeInputs,
} from './tradeCalculator';

// ─────────────────────────────────────────────────────────────────────────────
// calculateRRR
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRRR', () => {
  it('calculates Long RRR correctly — WMT (entry 58.98, stop 57.02, target 62.90 → RRR 2.0)', () => {
    // risk = 58.98 - 57.02 = 1.96 | reward = 62.90 - 58.98 = 3.92
    const rrr = calculateRRR(58.98, 57.02, 62.90, 'Long');
    expect(rrr).toBeCloseTo(2.0, 1);
  });

  it('calculates Long RRR for expensive stock — AMZN (entry 496.08, stop 487.07, target 532.10 → RRR ~4.0)', () => {
    // risk = 9.01 | reward = 36.02
    const rrr = calculateRRR(496.08, 487.07, 532.10, 'Long');
    expect(rrr).toBeCloseTo(4.0, 1);
  });

  it('calculates Long RRR for cheap stock — AMD (entry 2.32, stop 2.00, target 2.96 → RRR 2.0)', () => {
    // risk = 0.32 | reward = 0.64
    const rrr = calculateRRR(2.32, 2.00, 2.96, 'Long');
    expect(rrr).toBeCloseTo(2.0, 1);
  });

  it('calculates Short RRR correctly — NFLX (entry 98.18, stop 100.18, target 88.18 → RRR 5.0)', () => {
    // risk = 2.00 | reward = 10.00
    const rrr = calculateRRR(98.18, 100.18, 88.18, 'Short');
    expect(rrr).toBeCloseTo(5.0, 1);
  });

  it('calculates Short RRR at 2.0 — MSFT (entry 50.00, stop 51.50, target 47.00 → RRR 2.0)', () => {
    // risk = 1.50 | reward = 3.00
    const rrr = calculateRRR(50.00, 51.50, 47.00, 'Short');
    expect(rrr).toBeCloseTo(2.0, 1);
  });

  it('returns 0 when stop is above entry on a Long trade — AMD (entry 2.32, stop 2.50)', () => {
    const rrr = calculateRRR(2.32, 2.50, 2.96, 'Long');
    expect(rrr).toBe(0);
  });

  it('returns 0 when stop is below entry on a Short trade', () => {
    const rrr = calculateRRR(98.18, 96.00, 88.18, 'Short');
    expect(rrr).toBe(0);
  });

  it('calculates fractional RRR — GPRO (entry 11.69, stop 11.09, target 12.89 → RRR 2.0)', () => {
    // risk = 0.60 | reward = 1.20
    const rrr = calculateRRR(11.69, 11.09, 12.89, 'Long');
    expect(rrr).toBeCloseTo(2.0, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRiskPercent — all 5 tiers and boundary values
// ─────────────────────────────────────────────────────────────────────────────
describe('getRiskPercent', () => {
  it('returns 1.0% for RRR below 2.0', () => {
    expect(getRiskPercent(1.99)).toBe(1.0);
    expect(getRiskPercent(1.0)).toBe(1.0);
    expect(getRiskPercent(0.5)).toBe(1.0);
  });

  it('returns 1.25% for RRR exactly 2.0', () => {
    expect(getRiskPercent(2.0)).toBe(1.25);
  });

  it('returns 1.25% for RRR between 2.0 and 2.50', () => {
    expect(getRiskPercent(2.25)).toBe(1.25);
    expect(getRiskPercent(2.5)).toBe(1.25);
  });

  it('returns 1.5% for RRR between 2.51 and 3.0', () => {
    expect(getRiskPercent(2.51)).toBe(1.5);
    expect(getRiskPercent(2.75)).toBe(1.5);
    expect(getRiskPercent(3.0)).toBe(1.5);
  });

  it('returns 1.75% for RRR between 3.01 and 3.50', () => {
    expect(getRiskPercent(3.01)).toBe(1.75);
    expect(getRiskPercent(3.25)).toBe(1.75);
    expect(getRiskPercent(3.5)).toBe(1.75);
  });

  it('returns 2.0% for RRR 3.51 and above', () => {
    expect(getRiskPercent(3.51)).toBe(2.0);
    expect(getRiskPercent(4.0)).toBe(2.0);
    expect(getRiskPercent(10.0)).toBe(2.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPositionSize
// ─────────────────────────────────────────────────────────────────────────────
describe('getPositionSize', () => {
  it('calculates Long position size — WMT at $10,000 account, 1.25% risk', () => {
    // dollarRisk = 125, stopDist = 1.96, shares = floor(125/1.96) = 63
    const result = getPositionSize(10000, 1.25, 58.98, 57.02, 'Long');
    expect(result.dollarRisk).toBeCloseTo(125, 0);
    expect(result.shares).toBe(63);
  });

  it('calculates Short position size — NFLX at $25,000 account, 1.5% risk', () => {
    // dollarRisk = 375, stopDist = 2.00, shares = floor(375/2.00) = 187
    const result = getPositionSize(25000, 1.5, 98.18, 100.18, 'Short');
    expect(result.dollarRisk).toBeCloseTo(375, 0);
    expect(result.shares).toBe(187);
  });

  it('calculates position for cheap stock — AMD at $5,000 account, 1.0% risk', () => {
    // dollarRisk = 50, stopDist = 0.32, shares = floor(50/0.32) = 156
    const result = getPositionSize(5000, 1.0, 2.32, 2.00, 'Long');
    expect(result.dollarRisk).toBeCloseTo(50, 0);
    expect(result.shares).toBe(156);
  });

  it('returns 0 shares when stop distance is zero or invalid', () => {
    const result = getPositionSize(10000, 1.25, 58.98, 58.98, 'Long');
    expect(result.shares).toBe(0);
    expect(result.dollarRisk).toBe(0);
  });

  it('calculates position for expensive stock — AMZN at $50,000 account, 2.0% risk', () => {
    // dollarRisk = 1000, stopDist ≈ 9.01, shares = floor(1000/9.01...) = 110 (floating-point floor)
    const result = getPositionSize(50000, 2.0, 496.08, 487.07, 'Long');
    expect(result.dollarRisk).toBeCloseTo(1000, 0);
    expect(result.shares).toBe(110);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateMiniStructure — Step 2.3
// ─────────────────────────────────────────────────────────────────────────────
describe('validateMiniStructure', () => {
  describe('SwingPoint stop', () => {
    it('passes when RRR >= 2.0 — WMT setup (RRR 2.0)', () => {
      const result = validateMiniStructure(2.0, 'SwingPoint', 'Long');
      expect(result.pass).toBe(true);
    });

    it('passes when RRR well above minimum — AMZN setup (RRR 4.0)', () => {
      const result = validateMiniStructure(4.0, 'SwingPoint', 'Long');
      expect(result.pass).toBe(true);
    });

    it('fails when RRR below 2.0 — GPRO setup (RRR 1.8)', () => {
      // GPRO entry 11.69, stop 11.09 but insufficient reward
      const result = validateMiniStructure(1.8, 'SwingPoint', 'Long');
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('below minimum');
    });

    it('fails when RRR is 1.99 (just under 2.0 threshold)', () => {
      const result = validateMiniStructure(1.99, 'SwingPoint', 'Short');
      expect(result.pass).toBe(false);
    });
  });

  describe('BIT 1-bar stop', () => {
    it('passes for Long when RRR meets minimum and under max (2.25–6.0)', () => {
      const result = validateMiniStructure(3.5, 'BIT1', 'Long');
      expect(result.pass).toBe(true);
    });

    it('fails for Long when RRR exceeds max 6.0', () => {
      const result = validateMiniStructure(6.1, 'BIT1', 'Long');
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('exceeds max');
    });

    it('passes for Short when RRR meets minimum and under max (2.25–4.5)', () => {
      const result = validateMiniStructure(3.0, 'BIT1', 'Short');
      expect(result.pass).toBe(true);
    });

    it('fails for Short when RRR exceeds max 4.5 — NFLX Short would hit this at high RRR', () => {
      const result = validateMiniStructure(4.6, 'BIT1', 'Short');
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('exceeds max');
    });

    it('fails when RRR below BIT minimum of 2.25', () => {
      // AMD entry 2.32 with tiny stop: RRR = 2.0 — valid for SwingPoint but not BIT
      const result = validateMiniStructure(2.0, 'BIT1', 'Long');
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('below minimum');
    });
  });

  describe('BIT 2-bar stop', () => {
    it('passes for Long when RRR within 2.25–5.0', () => {
      const result = validateMiniStructure(4.0, 'BIT2', 'Long');
      expect(result.pass).toBe(true);
    });

    it('fails for Long when RRR exceeds max 5.0', () => {
      const result = validateMiniStructure(5.1, 'BIT2', 'Long');
      expect(result.pass).toBe(false);
    });

    it('passes for Short when RRR within 2.25–3.5', () => {
      const result = validateMiniStructure(3.0, 'BIT2', 'Short');
      expect(result.pass).toBe(true);
    });

    it('fails for Short when RRR exceeds max 3.5', () => {
      const result = validateMiniStructure(3.6, 'BIT2', 'Short');
      expect(result.pass).toBe(false);
    });
  });

  describe('BIT 3+ bar stop', () => {
    it('passes when RRR within 2.25–3.25', () => {
      const result = validateMiniStructure(3.0, 'BIT3Plus', 'Long');
      expect(result.pass).toBe(true);
    });

    it('fails when RRR exceeds max 3.25 (same for both directions)', () => {
      const result = validateMiniStructure(3.26, 'BIT3Plus', 'Long');
      expect(result.pass).toBe(false);
    });

    it('fails for Short when RRR exceeds max 3.25', () => {
      const result = validateMiniStructure(3.26, 'BIT3Plus', 'Short');
      expect(result.pass).toBe(false);
    });

    it('fails when RRR below 2.25', () => {
      const result = validateMiniStructure(2.24, 'BIT3Plus', 'Short');
      expect(result.pass).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateConfluence — Step 2.4
// ─────────────────────────────────────────────────────────────────────────────
describe('validateConfluence', () => {
  describe('Addon Entry', () => {
    it('passes when RRR >= 0.25 and entry is 0.5%+ above previous — WMT add-on', () => {
      // WMT entry 58.98, previous entry 58.00 → 1.69% apart ✓
      const result = validateConfluence('AddonEntry', 2.0, 'Long', undefined, 58.98, 58.00);
      expect(result.pass).toBe(true);
    });

    it('fails when RRR below 0.25', () => {
      const result = validateConfluence('AddonEntry', 0.2, 'Long', undefined, 58.98, 58.00);
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('RRR ≥ 0.25');
    });

    it('fails when entry is less than 0.5% from previous — GPRO add-on too close', () => {
      // GPRO entry 11.69, previous 11.68 → 0.086% — too close
      const result = validateConfluence('AddonEntry', 1.0, 'Long', undefined, 11.69, 11.68);
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('0.5%');
    });

    it('fails when entry equals previous entry price', () => {
      const result = validateConfluence('AddonEntry', 1.0, 'Long', undefined, 58.98, 58.98);
      expect(result.pass).toBe(false);
    });

    it('passes at clearly >= 0.5% spacing — AAPL add-on', () => {
      // AAPL entry 103.91, previous 103.38 → (0.53/103.38) = 0.513% >= 0.5% ✓
      const result = validateConfluence('AddonEntry', 0.5, 'Long', undefined, 103.91, 103.38);
      expect(result.pass).toBe(true);
    });

    it('passes for Short direction add-on — NFLX add-on Short', () => {
      // Short add-on: entry 97.00, previous 98.18 → 1.2% apart ✓
      const result = validateConfluence('AddonEntry', 1.5, 'Short', undefined, 97.00, 98.18);
      expect(result.pass).toBe(true);
    });
  });

  describe('PD Divergence', () => {
    it('passes Long when RRR >= 0.5 and angle >= 45° — WMT Long', () => {
      const result = validateConfluence('PDDivergence', 1.0, 'Long', 45);
      expect(result.pass).toBe(true);
    });

    it('passes Short when RRR >= 0.5 and angle >= 65° — NFLX Short', () => {
      const result = validateConfluence('PDDivergence', 1.0, 'Short', 65);
      expect(result.pass).toBe(true);
    });

    it('fails Long when RRR below 0.5', () => {
      const result = validateConfluence('PDDivergence', 0.4, 'Long', 50);
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('RRR ≥ 0.5');
    });

    it('fails Long when angle below 45° — shallow trend', () => {
      const result = validateConfluence('PDDivergence', 1.0, 'Long', 44);
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('45°');
    });

    it('fails Short when angle below 65° — MSFT Short shallow angle', () => {
      const result = validateConfluence('PDDivergence', 1.0, 'Short', 64);
      expect(result.pass).toBe(false);
      expect(result.detail).toContain('65°');
    });

    it('passes Long at strong angle — AMD strong uptrend (75°)', () => {
      const result = validateConfluence('PDDivergence', 2.0, 'Long', 75);
      expect(result.pass).toBe(true);
    });

    it('fails when angle is not provided', () => {
      const result = validateConfluence('PDDivergence', 1.0, 'Long', undefined);
      expect(result.pass).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// runRuleEngine — full integration paths
// ─────────────────────────────────────────────────────────────────────────────
describe('runRuleEngine', () => {
  /** WMT Long setup — all conditions valid, should produce BUY */
  const wmtBuyInputs: TradeInputs = {
    direction: 'Long',
    entryPrice: 58.98,
    stopPrice: 57.02,    // risk: 1.96
    targetPrice: 62.90,  // reward: 3.92 → RRR 2.0
    accountSize: 10000,
    stopType: 'SwingPoint',
    confluenceType: 'PDDivergence',
    divergenceAngle: 50,
    macroStructureValid: true,
    breakoutConfirmed: true,
  };

  /** NFLX Short setup — all conditions valid, should produce SELL */
  const nflxSellInputs: TradeInputs = {
    direction: 'Short',
    entryPrice: 98.18,
    stopPrice: 100.18,   // risk: 2.00
    targetPrice: 88.18,  // reward: 10.00 → RRR 5.0
    accountSize: 25000,
    stopType: 'SwingPoint',
    confluenceType: 'PDDivergence',
    divergenceAngle: 70,
    macroStructureValid: true,
    breakoutConfirmed: true,
  };

  it('produces BUY for a valid Long setup — WMT breakout', () => {
    const result = runRuleEngine(wmtBuyInputs);
    expect(result.status).toBe('BUY');
    expect(result.direction).toBe('Long');
    expect(result.action).toBe('SIGNAL_HIGH_PROBABILITY_ENTRY');
  });

  it('produces SELL for a valid Short setup — NFLX breakdown', () => {
    const result = runRuleEngine(nflxSellInputs);
    expect(result.status).toBe('SELL');
    expect(result.direction).toBe('Short');
    expect(result.action).toBe('SIGNAL_HIGH_PROBABILITY_ENTRY');
  });

  it('produces HOLD when macro structure is not confirmed', () => {
    const result = runRuleEngine({ ...wmtBuyInputs, macroStructureValid: false });
    expect(result.status).toBe('HOLD');
    expect(result.steps.macroStructure.pass).toBe(false);
    expect(result.action).toBe('HOLD_NO_VALID_SETUP');
  });

  it('produces HOLD when breakout is not confirmed', () => {
    const result = runRuleEngine({ ...wmtBuyInputs, breakoutConfirmed: false });
    expect(result.status).toBe('HOLD');
    expect(result.steps.breakoutConfirmation.pass).toBe(false);
  });

  it('produces HOLD when RRR is too low for SwingPoint stop (< 2.0) — AMD tiny movement', () => {
    const result = runRuleEngine({
      ...wmtBuyInputs,
      entryPrice: 2.32,
      stopPrice: 2.15,   // risk: 0.17
      targetPrice: 2.59, // reward: 0.27 → RRR ~1.6
    });
    expect(result.status).toBe('HOLD');
    expect(result.steps.miniStructure.pass).toBe(false);
  });

  it('produces HOLD when BIT stop RRR exceeds Long max — AMZN BIT1 too high', () => {
    // BIT1 Long max is 6.0. Use target=549.00 (RRR≈5.87, passes) then 551.00 (RRR≈6.10, fails)
    const baseInputs = {
      ...wmtBuyInputs,
      stopType: 'BIT1' as const,
      entryPrice: 496.08,
      stopPrice: 487.07,  // risk ≈ 9.01
    };

    // Clearly within max (RRR ≈ 5.87)
    const passingResult = runRuleEngine({ ...baseInputs, targetPrice: 549.00 });
    expect(passingResult.steps.miniStructure.pass).toBe(true);

    // Clearly over max (RRR ≈ 6.10)
    const overMaxResult = runRuleEngine({ ...baseInputs, targetPrice: 551.00 });
    expect(overMaxResult.steps.miniStructure.pass).toBe(false);
    expect(overMaxResult.status).toBe('HOLD');
  });

  it('produces HOLD when PD Divergence angle is insufficient for Long — flat trend', () => {
    const result = runRuleEngine({
      ...wmtBuyInputs,
      confluenceType: 'PDDivergence',
      divergenceAngle: 30, // below 45° minimum for Long
    });
    expect(result.status).toBe('HOLD');
    expect(result.steps.confluence.pass).toBe(false);
  });

  it('produces HOLD when Addon Entry spacing is too tight — GPRO add-on too close', () => {
    const result = runRuleEngine({
      ...wmtBuyInputs,
      entryPrice: 11.69,
      stopPrice: 11.09,    // risk: 0.60
      targetPrice: 12.89,  // reward: 1.20 → RRR 2.0
      confluenceType: 'AddonEntry',
      previousEntryPrice: 11.68, // only $0.01 apart — under 0.5%
    });
    expect(result.status).toBe('HOLD');
    expect(result.steps.confluence.pass).toBe(false);
  });

  it('assigns correct risk percent — WMT RRR 2.0 → 1.25%', () => {
    const result = runRuleEngine(wmtBuyInputs);
    expect(result.riskPercent).toBe(1.25);
    expect(result.tradeParameters.riskPercentage).toBe('1.25%');
  });

  it('assigns correct risk percent — AMZN RRR ~4.0 → 2.0%', () => {
    const result = runRuleEngine({
      ...wmtBuyInputs,
      entryPrice: 496.08,
      stopPrice: 487.07,  // risk: 9.01
      targetPrice: 532.12, // reward: ~36.04 → RRR ~4.0
    });
    expect(result.riskPercent).toBe(2.0);
  });

  it('calculates correct position size in trade parameters — WMT $10k account', () => {
    const result = runRuleEngine(wmtBuyInputs);
    // dollarRisk = 10000 * 1.25% = 125, shares = floor(125/1.96) = 63
    expect(result.tradeParameters.positionShares).toBe(63);
    expect(result.tradeParameters.dollarRisk).toBeCloseTo(125, 0);
  });

  it('calculates potential profit — WMT 63 shares × $3.92 reward = $246.96', () => {
    const result = runRuleEngine(wmtBuyInputs);
    // 63 shares × (62.90 - 58.98) = 63 × 3.92 = 246.96
    expect(result.tradeParameters.potentialProfit).toBeCloseTo(246.96, 0);
  });

  it('all four steps pass for a valid BUY setup', () => {
    const result = runRuleEngine(wmtBuyInputs);
    expect(result.steps.macroStructure.pass).toBe(true);
    expect(result.steps.breakoutConfirmation.pass).toBe(true);
    expect(result.steps.miniStructure.pass).toBe(true);
    expect(result.steps.confluence.pass).toBe(true);
  });

  it('HOLD result still returns RRR and parameters for display', () => {
    const result = runRuleEngine({ ...wmtBuyInputs, macroStructureValid: false });
    expect(result.rrr).toBeGreaterThan(0);
    expect(result.tradeParameters.entryPrice).toBe(58.98);
    expect(result.tradeParameters.stopPrice).toBe(57.02);
  });
});
