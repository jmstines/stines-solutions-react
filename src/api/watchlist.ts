const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.stinessolutions.com';

export interface WatchlistSymbol {
  symbol: string;
  addedAt: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export function getWatchlist(): Promise<{ symbols: WatchlistSymbol[] }> {
  return request('/watchlist');
}

export function addToWatchlist(symbol: string): Promise<{ symbol: string }> {
  return request('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
}

export function removeFromWatchlist(symbol: string): Promise<{ symbol: string }> {
  return request(`/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
}
