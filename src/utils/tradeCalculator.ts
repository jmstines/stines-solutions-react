// Trade rule engine — pure functions, no UI dependencies
// Based on the 5BP Breakout System rules

export type Direction = 'Long' | 'Short';
export type StopType = 'SwingPoint' | 'BIT1' | 'BIT2' | 'BIT3Plus';
export type ConfluenceType = 'AddonEntry' | 'PDDivergence';
export type TradeStatus = 'BUY' | 'SELL' | 'HOLD';

export interface TradeInputs {
  direction: Direction;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  accountSize: number;
  stopType: StopType;
  confluenceType: ConfluenceType;
  // Addon Entry fields
  previousEntryPrice?: number;
  // PD Divergence fields
  divergenceAngle?: number;
  // Step 2.1 — user confirms macro structure (manual validation for Phase 1)
  macroStructureValid: boolean;
  // Step 2.2 — user confirms breakout confirmation (manual validation for Phase 1)
  breakoutConfirmed: boolean;
}

export interface StepResult {
  pass: boolean;
  label: string;
  detail: string;
}

export interface TradeResult {
  status: TradeStatus;
  direction: Direction;
  steps: {
    macroStructure: StepResult;
    breakoutConfirmation: StepResult;
    miniStructure: StepResult;
    confluence: StepResult;
  };
  rrr: number;
  riskPercent: number;
  tradeParameters: {
    entryPrice: number;
    stopPrice: number;
    targetPrice: number;
    calculatedRRR: number;
    riskPercentage: string;
    positionShares: number;
    dollarRisk: number;
    potentialProfit: number;
  };
  action: string;
}

/** Risk-reward ratio */
export function calculateRRR(
  entry: number,
  stop: number,
  target: number,
  direction: Direction
): number {
  if (direction === 'Long') {
    const risk = entry - stop;
    const reward = target - entry;
    if (risk <= 0) return 0;
    return reward / risk;
  } else {
    const risk = stop - entry;
    const reward = entry - target;
    if (risk <= 0) return 0;
    return reward / risk;
  }
}

/** Risk % based on RRR table */
export function getRiskPercent(rrr: number): number {
  if (rrr < 2.0) return 1.0;
  if (rrr <= 2.5) return 1.25;
  if (rrr <= 3.0) return 1.5;
  if (rrr <= 3.5) return 1.75;
  return 2.0;
}

/** Number of shares and dollar risk */
export function getPositionSize(
  accountSize: number,
  riskPercent: number,
  entry: number,
  stop: number,
  direction: Direction
): { shares: number; dollarRisk: number } {
  const dollarRisk = (accountSize * riskPercent) / 100;
  const stopDistance = direction === 'Long' ? entry - stop : stop - entry;
  if (stopDistance <= 0) return { shares: 0, dollarRisk: 0 };
  const shares = Math.floor(dollarRisk / stopDistance);
  return { shares, dollarRisk };
}

/** Max RRR allowed per stop type and direction */
function getMaxRRR(stopType: StopType, direction: Direction): number {
  if (stopType === 'SwingPoint') return Infinity;
  if (stopType === 'BIT1') return direction === 'Long' ? 6.0 : 4.5;
  if (stopType === 'BIT2') return direction === 'Long' ? 5.0 : 3.5;
  return 3.25; // BIT3Plus — same for both
}

/** Step 2.3 — Mini-structure RRR validation */
export function validateMiniStructure(
  rrr: number,
  stopType: StopType,
  direction: Direction
): StepResult {
  const minRRR = stopType === 'SwingPoint' ? 2.0 : 2.25;
  const maxRRR = getMaxRRR(stopType, direction);
  const label = 'Step 2.3 — Mini-Structure RRR';

  if (rrr < minRRR) {
    return {
      pass: false,
      label,
      detail: `RRR ${rrr.toFixed(2)} is below minimum ${minRRR} for ${stopType === 'SwingPoint' ? 'Swing Point' : 'BIT'} stop.`,
    };
  }
  if (rrr > maxRRR) {
    return {
      pass: false,
      label,
      detail: `RRR ${rrr.toFixed(2)} exceeds max ${maxRRR} for ${stopType} ${direction} stop.`,
    };
  }
  return {
    pass: true,
    label,
    detail: `RRR ${rrr.toFixed(2)} is within valid range [${minRRR}, ${maxRRR === Infinity ? '∞' : maxRRR}].`,
  };
}

/** Step 2.4 — Confluence validation */
export function validateConfluence(
  confluenceType: ConfluenceType,
  rrr: number,
  direction: Direction,
  divergenceAngle?: number,
  entryPrice?: number,
  previousEntryPrice?: number
): StepResult {
  const label = 'Step 2.4 — Confluence';

  if (confluenceType === 'AddonEntry') {
    if (rrr < 0.25) {
      return { pass: false, label, detail: `Addon Entry requires RRR ≥ 0.25 (got ${rrr.toFixed(2)}).` };
    }
    if (entryPrice != null && previousEntryPrice != null) {
      const pctDiff = Math.abs(entryPrice - previousEntryPrice) / previousEntryPrice;
      if (pctDiff < 0.005) {
        return {
          pass: false,
          label,
          detail: `Entry must be ≥ 0.5% above/below previous entry. Got ${(pctDiff * 100).toFixed(2)}%.`,
        };
      }
    }
    return { pass: true, label, detail: `Addon Entry: RRR ${rrr.toFixed(2)} ✓, entry spacing ✓.` };
  }

  // PD Divergence
  const minAngle = direction === 'Long' ? 45 : 65;
  if (rrr < 0.5) {
    return { pass: false, label, detail: `PD Divergence requires RRR ≥ 0.5 (got ${rrr.toFixed(2)}).` };
  }
  if (divergenceAngle == null || divergenceAngle < minAngle) {
    return {
      pass: false,
      label,
      detail: `PD Divergence requires angle ≥ ${minAngle}° for ${direction}. Got ${divergenceAngle ?? 'N/A'}°.`,
    };
  }
  return {
    pass: true,
    label,
    detail: `PD Divergence: RRR ${rrr.toFixed(2)} ✓, angle ${divergenceAngle}° ≥ ${minAngle}° ✓.`,
  };
}

/** Full rule engine — runs all 4 steps and returns a TradeResult */
export function runRuleEngine(inputs: TradeInputs): TradeResult {
  const {
    direction,
    entryPrice,
    stopPrice,
    targetPrice,
    accountSize,
    stopType,
    confluenceType,
    macroStructureValid,
    breakoutConfirmed,
    previousEntryPrice,
    divergenceAngle,
  } = inputs;

  const rrr = calculateRRR(entryPrice, stopPrice, targetPrice, direction);
  const riskPercent = getRiskPercent(rrr);
  const { shares, dollarRisk } = getPositionSize(accountSize, riskPercent, entryPrice, stopPrice, direction);
  const potentialProfit = shares * Math.abs(targetPrice - entryPrice);

  const step21: StepResult = {
    pass: macroStructureValid,
    label: 'Step 2.1 — Macro Structure',
    detail: macroStructureValid
      ? 'Trending market with clear Support/Resistance confirmed.'
      : 'No clear trending structure or S/R level — HOLD.',
  };

  const step22: StepResult = {
    pass: breakoutConfirmed,
    label: 'Step 2.2 — Breakout Confirmation',
    detail: breakoutConfirmed
      ? '5BP breakout at S/R level matches macro trend direction.'
      : 'No valid 5BP breakout matching macro trend — HOLD.',
  };

  const step23 = validateMiniStructure(rrr, stopType, direction);

  const step24 = validateConfluence(
    confluenceType,
    rrr,
    direction,
    divergenceAngle,
    entryPrice,
    previousEntryPrice
  );

  const allPass = step21.pass && step22.pass && step23.pass && step24.pass;
  const status: TradeStatus = allPass ? (direction === 'Long' ? 'BUY' : 'SELL') : 'HOLD';

  return {
    status,
    direction,
    steps: {
      macroStructure: step21,
      breakoutConfirmation: step22,
      miniStructure: step23,
      confluence: step24,
    },
    rrr,
    riskPercent,
    tradeParameters: {
      entryPrice,
      stopPrice,
      targetPrice,
      calculatedRRR: rrr,
      riskPercentage: `${riskPercent}%`,
      positionShares: shares,
      dollarRisk,
      potentialProfit,
    },
    action: allPass ? 'SIGNAL_HIGH_PROBABILITY_ENTRY' : 'HOLD_NO_VALID_SETUP',
  };
}
