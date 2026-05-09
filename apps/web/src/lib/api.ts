const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API Error');
  }
  return res.json();
}
