const PEXELS_BASE = 'https://api.pexels.com/v1';

// All images are now hardcoded directly in LEVELS — no dynamic overrides needed
const CASE_QUERIES: Record<number, string> = {};

const cache = new Map<number, string>();

export async function fetchPexelsImage(caseId: number): Promise<string | null> {
  if (cache.has(caseId)) return cache.get(caseId)!;

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'your_pexels_api_key_here') {
    console.warn('Pexels API key not set — add VITE_PEXELS_API_KEY to .env.local');
    return null;
  }

  const query = CASE_QUERIES[caseId];
  if (!query) return null;

  try {
    const res = await fetch(
      `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const url: string | undefined = data.photos?.[0]?.src?.large;
    if (url) cache.set(caseId, url);
    return url ?? null;
  } catch {
    return null;
  }
}
