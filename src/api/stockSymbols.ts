const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.stinessolutions.com';

export interface StockSymbol {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockSymbolsResponse {
  symbols: StockSymbol[];
  lastUpdated: number | null;
  count: number;
}

const CACHE_KEY = 'stockSymbolsCache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  data: StockSymbolsResponse;
  cachedAt: number;
}

function readLocalCache(): StockSymbolsResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeLocalCache(data: StockSymbolsResponse): void {
  try {
    const entry: CacheEntry = { data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* storage full — silently skip */ }
}

export function clearLocalCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

export async function getStockSymbols(forceRefresh = false): Promise<StockSymbolsResponse> {
  if (!forceRefresh) {
    const cached = readLocalCache();
    if (cached) return cached;
  }

  const response = await fetch(`${API_BASE_URL}/stock-symbols`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Failed to fetch symbols (${response.status})`);

  writeLocalCache(data);
  return data as StockSymbolsResponse;
}

export async function refreshStockSymbols(): Promise<{ message: string; count: number }> {
  const response = await fetch(`${API_BASE_URL}/stock-symbols/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Refresh failed (${response.status})`);

  clearLocalCache();
  return data;
}
