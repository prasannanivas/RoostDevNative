import axios from "axios";
import { getAuthHeaders } from "./authHeaders";

// In-memory cache for API responses
const cache = new Map();

/**
 * Fetches data from an API endpoint with caching
 * @param {string} url - The API endpoint URL
 * @param {boolean} requiresAuth - Whether the endpoint requires authentication
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} - The API response data
 */
export const fetchWithCache = async (
  url,
  requiresAuth = false,
  ttl = 300000
) => {
  const now = Date.now();

  // Check if we have a valid cached response
  if (cache.has(url)) {
    const cached = cache.get(url);
    if (now - cached.timestamp < ttl) {
      console.log(`[CACHE HIT] Using cached data for: ${url}`);
      return cached.data;
    } else {
      console.log(`[CACHE EXPIRED] Cache expired for: ${url}`);
      cache.delete(url);
    }
  }

  // Fetch fresh data
  console.log(`[CACHE MISS] Fetching fresh data from: ${url}`);
  const headers = requiresAuth ? await getAuthHeaders() : {};
  const response = await axios.get(url, { headers });

  // Cache the response
  cache.set(url, {
    data: response.data,
    timestamp: now,
  });

  return response.data;
};

/**
 * Clears the cache for a specific URL or all URLs
 * @param {string} url - Optional URL to clear. If not provided, clears all cache
 */
export const clearCache = (url = null) => {
  if (url) {
    cache.delete(url);
    console.log(`[CACHE CLEARED] Cleared cache for: ${url}`);
  } else {
    cache.clear();
    console.log(`[CACHE CLEARED] Cleared all cache`);
  }
};

/**
 * Gets cache statistics
 * @returns {object} - Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
};
