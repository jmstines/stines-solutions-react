const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.stinessolutions.com';

export interface TradeSignal {
  symbol: string;
  signalType: 'Candidate' | 'Filtered' | 'Error';
  filterReason?: string;
  direction?: 'Long' | 'Short';
  entry?: number;
  stop?: number;
  target?: number;
  rrr?: number;
  riskPercent?: number;
  shares?: number;
  dollarRisk?: number;
  breakoutLevel?: number;
  step21Pass?: boolean;
  step22Pass?: boolean;
  step23Pass?: boolean;
  step24Note?: string;
  scannedAt?: number;
}

export interface TradeSignalsResponse {
  marketDate: string;
  scanStatus: 'processing' | 'completed' | 'failed' | 'no_data';
  scannedAt: number | null;
  totalTickers: number;
  completedTickers: number;
  signals: TradeSignal[];
}

export async function getTradeSignals(date?: string): Promise<TradeSignalsResponse> {
  const url = date
    ? `${API_BASE_URL}/trade-signals?date=${encodeURIComponent(date)}`
    : `${API_BASE_URL}/trade-signals`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to fetch trade signals (${response.status})`);
  }

  return response.json();
}
