/**
 * fetchCache.js
 * Lightweight in-memory request cache for API calls.
 *
 * Usage:
 *   import { fetchWithCache, bustCache } from '@/core/utils/fetchCache.js';
 *
 *   // Cache a GET for 30 seconds (default)
 *   const data = await fetchWithCache('/api/projects', { headers: authHeaders() });
 *
 *   // Cache for 60 seconds
 *   const data = await fetchWithCache('/api/projects', options, 60_000);
 *
 *   // Manually invalidate when data changes (e.g. after create/update)
 *   bustCache('/api/projects');
 *
 *   // Wipe entire cache on logout
 *   bustCache();
 */

const _cache = new Map();   // key → { data, ts, promise }

const DEFAULT_TTL = 30_000; // 30 seconds

/**
 * Fetch with in-memory caching.
 * Concurrent calls for the same URL share one in-flight promise (request deduplication).
 *
 * @param {string} url        - Full URL or path
 * @param {RequestInit} init  - fetch() options (method, headers, …)
 * @param {number} ttlMs      - Cache lifetime in milliseconds (default 30 s)
 * @returns {Promise<any>}    - Parsed JSON response
 */
export async function fetchWithCache(url, init = {}, ttlMs = DEFAULT_TTL) {
  // Only cache GET/HEAD requests
  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    // For mutations bust the cache for this URL and proceed normally
    bustCache(url);
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
    return res.json().catch(() => null);
  }

  const now = Date.now();
  const cached = _cache.get(url);

  // Return cached data if still fresh
  if (cached && !cached.promise && now - cached.ts < ttlMs) {
    return cached.data;
  }

  // Deduplicate concurrent requests for the same URL
  if (cached && cached.promise) {
    return cached.promise;
  }

  // Fire the real request and cache the promise immediately
  const promise = fetch(url, init)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
      return res.json();
    })
    .then(data => {
      _cache.set(url, { data, ts: Date.now(), promise: null });
      return data;
    })
    .catch(err => {
      // On error, remove the pending entry so next call retries
      _cache.delete(url);
      throw err;
    });

  _cache.set(url, { data: cached?.data ?? null, ts: cached?.ts ?? 0, promise });
  return promise;
}

/**
 * Invalidate cache entries.
 * @param {string|RegExp} [pattern] - URL string to delete, regex to match, or omit to clear all.
 */
export function bustCache(pattern) {
  if (pattern === undefined) {
    _cache.clear();
    return;
  }
  if (pattern instanceof RegExp) {
    for (const key of _cache.keys()) {
      if (pattern.test(key)) _cache.delete(key);
    }
    return;
  }
  _cache.delete(String(pattern));
}
