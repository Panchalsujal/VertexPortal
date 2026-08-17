import { createClient } from "redis";
import { config } from "../config/config.js";

/**
 * Multi-Tier High Performance Render Cache Service
 * 
 * Provides:
 * - Locale-aware and query-normalized cache key generation
 * - Hybrid Multi-Tier Cache: L1 Fast In-Memory LRU + L2 Distributed Redis
 * - Stale-While-Revalidate (SWR) background regeneration
 * - Tag-based cache invalidation (e.g. `course:react-masterclass`, `catalog:*`, `certificate:CERT-123`)
 * - Rendering load metrics (hits, misses, renders prevented, latency savings)
 */

class RenderCacheService {
  constructor(options = {}) {
    this.maxItems = options.maxItems || 1000;
    this.defaultTtlSeconds = options.defaultTtlSeconds || 3600; // 1 hour default
    this.swrGraceSeconds = options.swrGraceSeconds || 300; // 5 min SWR window
    
    // L1: In-memory cache storage (sub-millisecond local access)
    this.cache = new Map();
    // Inverted index for tag-based invalidation: tag -> Set<key>
    this.tagsIndex = new Map();
    // LRU key access tracking
    this.keyAccessTimestamps = new Map();

    // Revalidation lock to prevent dog-piling
    this.activeRevalidations = new Set();

    // L2: Optional Redis client
    this.redisClient = null;
    this.isRedisConnected = false;

    // Metrics
    this.metrics = {
      hits: 0,
      l1Hits: 0,
      l2RedisHits: 0,
      misses: 0,
      swrHits: 0,
      invalidations: 0,
      rendersPrevented: 0,
      estimatedMsSaved: 0,
      createdAt: new Date().toISOString(),
    };

    // Auto-connect to Redis if REDIS_URL is configured in environment
    if (config.REDIS_URL) {
      this.initRedis();
    }

    // Scheduled L1 cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.evictExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Cleans and normalizes Redis URL (handles quotes, redis-cli prefixes, and TLS upgrade)
   */
  sanitizeRedisUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return null;
    let url = rawUrl.trim();

    // Strip surrounding quotes
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1).trim();
    }

    // Strip "redis-cli --tls -u " or "redis-cli -u " prefix if pasted directly from CLI tab
    const cliMatch = url.match(/redis-cli\s+(?:--tls\s+)?-u\s+(.+)/i);
    if (cliMatch && cliMatch[1]) {
      url = cliMatch[1].trim();
    }

    // If Upstash or cloud Redis is using standard redis:// without TLS, convert to rediss://
    if (url.includes(".upstash.io") && url.startsWith("redis://")) {
      url = url.replace(/^redis:\/\//i, "rediss://");
    }

    return url;
  }

  /**
   * Initializes Redis connection gracefully using REDIS_URL
   */
  async initRedis(customConfig = null) {
    try {
      const rawUrl = customConfig || config.REDIS_URL;
      if (!rawUrl) return;

      const cleanedUrl = this.sanitizeRedisUrl(rawUrl);
      this.redisClient = createClient({ url: cleanedUrl });

      this.redisClient.on("error", (err) => {
        if (this.isRedisConnected) {
          console.warn("[RENDER-CACHE] Redis connection lost, falling back to L1 in-memory cache:", err.message);
        }
        this.isRedisConnected = false;
      });
      this.redisClient.on("ready", () => {
        this.isRedisConnected = true;
        console.log("[RENDER-CACHE] Connected to Redis L2 cache tier");
      });
      await this.redisClient.connect();
    } catch (err) {
      console.warn("[RENDER-CACHE] Redis connection failed, using L1 in-memory cache:", err.message);
      this.isRedisConnected = false;
    }
  }

  /**
   * Normalize and extract locale from request
   * @param {Object} req Express request or options
   * @returns {string} Normalized locale code (e.g. 'en', 'es', 'fr', 'hi', 'de')
   */
  normalizeLocale(reqOrLocale) {
    if (typeof reqOrLocale === "string") {
      const match = reqOrLocale.toLowerCase().trim().slice(0, 2);
      const supported = ["en", "es", "fr", "de", "hi", "zh", "ja", "pt"];
      return supported.includes(match) ? match : "en";
    }

    if (!reqOrLocale) return "en";

    // 1. Query parameter: ?lang=es or ?locale=es
    const queryLang = reqOrLocale.query?.lang || reqOrLocale.query?.locale;
    if (queryLang && typeof queryLang === "string") {
      const normalized = queryLang.toLowerCase().trim().slice(0, 2);
      const supported = ["en", "es", "fr", "de", "hi", "zh", "ja", "pt"];
      if (supported.includes(normalized)) return normalized;
    }

    // 2. Cookie: NEXT_LOCALE or locale
    const cookieLang = reqOrLocale.cookies?.locale || reqOrLocale.cookies?.NEXT_LOCALE;
    if (cookieLang && typeof cookieLang === "string") {
      const normalized = cookieLang.toLowerCase().trim().slice(0, 2);
      const supported = ["en", "es", "fr", "de", "hi", "zh", "ja", "pt"];
      if (supported.includes(normalized)) return normalized;
    }

    // 3. Accept-Language header (e.g. "es-ES,es;q=0.9,en;q=0.8")
    const acceptHeader = reqOrLocale.headers?.["accept-language"] || reqOrLocale.headers?.["Accept-Language"];
    if (acceptHeader && typeof acceptHeader === "string") {
      const preferred = acceptHeader
        .split(",")
        .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
        .find((code) => ["en", "es", "fr", "de", "hi", "zh", "ja", "pt"].includes(code));
      if (preferred) return preferred;
    }

    return "en";
  }

  /**
   * Generates a deterministic, locale-aware cache key
   * Filters out volatile query parameters (utm_*, ref, fbclid, etc.)
   */
  generateCacheKey({ route, params = {}, query = {}, locale = "en", format = "html" }) {
    const normLocale = this.normalizeLocale(locale);

    // Filter query parameters to retain only deterministic business parameters
    const ignoredParams = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "fbclid",
      "gclid",
      "_t",
      "timestamp",
      "cache_bust",
      "lang",
      "locale",
    ]);

    const cleanQuery = {};
    const sortedKeys = Object.keys(query)
      .filter((k) => !ignoredParams.has(k.toLowerCase()))
      .sort();

    for (const key of sortedKeys) {
      cleanQuery[key] = query[key];
    }

    const cleanParams = {};
    const sortedParamKeys = Object.keys(params).sort();
    for (const key of sortedParamKeys) {
      cleanParams[key] = params[key];
    }

    const serializedParams = JSON.stringify(cleanParams);
    const serializedQuery = JSON.stringify(cleanQuery);

    return `ssr:${route}:loc=${normLocale}:fmt=${format}:p=${serializedParams}:q=${serializedQuery}`;
  }

  /**
   * Get cached item (L1 in-memory -> L2 Redis) or execute render function with SWR support
   */
  async getOrRender({
    key,
    tags = [],
    ttlSeconds = this.defaultTtlSeconds,
    renderFn,
    estimatedRenderCostMs = 50,
  }) {
    const now = Date.now();

    // 1. Check L1 In-Memory Cache
    const entry = this.cache.get(key);
    if (entry) {
      this.keyAccessTimestamps.set(key, now);

      if (now < entry.expiresAt) {
        this.metrics.hits++;
        this.metrics.l1Hits++;
        this.metrics.rendersPrevented++;
        this.metrics.estimatedMsSaved += estimatedRenderCostMs;
        return {
          content: entry.content,
          isHit: true,
          isStale: false,
          headers: entry.headers,
          generatedAt: entry.generatedAt,
          tier: "L1_MEMORY",
        };
      }

      if (now < entry.expiresAt + this.swrGraceSeconds * 1000) {
        this.metrics.swrHits++;
        this.metrics.hits++;
        this.metrics.l1Hits++;
        this.metrics.rendersPrevented++;
        this.metrics.estimatedMsSaved += estimatedRenderCostMs;

        this.scheduleBackgroundRevalidation(key, tags, ttlSeconds, renderFn);

        return {
          content: entry.content,
          isHit: true,
          isStale: true,
          headers: entry.headers,
          generatedAt: entry.generatedAt,
          tier: "L1_SWR",
        };
      }
    }

    // 2. Check L2 Redis Cache (if connected)
    if (this.isRedisConnected && this.redisClient) {
      try {
        const rawRedis = await this.redisClient.get(key);
        if (rawRedis) {
          const redisEntry = JSON.parse(rawRedis);
          // Populate L1 cache
          this.set({
            key,
            content: redisEntry.content,
            tags: redisEntry.tags || tags,
            ttlSeconds: Math.max(Math.floor((redisEntry.expiresAt - now) / 1000), 1),
            headers: redisEntry.headers,
            skipRedis: true, // already in Redis
          });

          this.metrics.hits++;
          this.metrics.l2RedisHits++;
          this.metrics.rendersPrevented++;
          this.metrics.estimatedMsSaved += estimatedRenderCostMs;

          return {
            content: redisEntry.content,
            isHit: true,
            isStale: false,
            headers: redisEntry.headers,
            generatedAt: redisEntry.generatedAt,
            tier: "L2_REDIS",
          };
        }
      } catch (err) {
        // Fall back gracefully to rendering
      }
    }

    // 3. Cache Miss or hard expired -> Render fresh content
    this.metrics.misses++;
    const renderStartTime = Date.now();
    const renderResult = await renderFn();
    const renderDuration = Date.now() - renderStartTime;

    const content = typeof renderResult === "object" && renderResult.content !== undefined
      ? renderResult.content
      : renderResult;

    const headers = typeof renderResult === "object" && renderResult.headers
      ? renderResult.headers
      : { "Content-Type": "text/html; charset=utf-8" };

    this.set({
      key,
      content,
      tags,
      ttlSeconds,
      headers,
    });

    return {
      content,
      isHit: false,
      isStale: false,
      headers,
      renderDurationMs: renderDuration,
      generatedAt: now,
      tier: "MISS_RENDERED",
    };
  }

  /**
   * Set item into cache (L1 Memory + L2 Redis)
   */
  set({ key, content, tags = [], ttlSeconds = this.defaultTtlSeconds, headers = {}, skipRedis = false }) {
    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    const entry = {
      content,
      tags,
      headers,
      generatedAt: now,
      expiresAt,
    };

    // Store in L1 Memory
    this.cache.set(key, entry);
    this.keyAccessTimestamps.set(key, now);

    // Index tags locally
    for (const tag of tags) {
      if (!this.tagsIndex.has(tag)) {
        this.tagsIndex.set(tag, new Set());
      }
      this.tagsIndex.get(tag).add(key);
    }

    // Store in L2 Redis
    if (!skipRedis && this.isRedisConnected && this.redisClient) {
      this.redisClient.setEx(key, ttlSeconds, JSON.stringify(entry)).catch(() => {});
    }
  }

  /**
   * Purge cache by exact key
   */
  purgeKey(key) {
    const entry = this.cache.get(key);
    if (entry) {
      for (const tag of entry.tags) {
        const keySet = this.tagsIndex.get(tag);
        if (keySet) {
          keySet.delete(key);
          if (keySet.size === 0) {
            this.tagsIndex.delete(tag);
          }
        }
      }
      this.cache.delete(key);
      this.keyAccessTimestamps.delete(key);
      this.metrics.invalidations++;
    }

    if (this.isRedisConnected && this.redisClient) {
      this.redisClient.del(key).catch(() => {});
    }

    return !!entry;
  }

  /**
   * Purge cache by tag or tag wildcard (e.g. "course:react-masterclass", "catalog:*")
   */
  purgeByTag(tagPattern) {
    let count = 0;
    const isWildcard = tagPattern.endsWith("*");
    const prefix = isWildcard ? tagPattern.slice(0, -1) : tagPattern;

    const matchingTags = [];
    for (const tag of this.tagsIndex.keys()) {
      if (isWildcard ? tag.startsWith(prefix) : tag === tagPattern) {
        matchingTags.push(tag);
      }
    }

    const keysToPurge = new Set();
    for (const tag of matchingTags) {
      const keys = this.tagsIndex.get(tag);
      if (keys) {
        for (const k of keys) {
          keysToPurge.add(k);
        }
      }
    }

    for (const key of keysToPurge) {
      if (this.purgeKey(key)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Purge all cache entries matching regex pattern
   */
  purgePattern(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        if (this.purgeKey(key)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Flush entire cache
   */
  flushAll() {
    const size = this.cache.size;
    this.cache.clear();
    this.tagsIndex.clear();
    this.keyAccessTimestamps.clear();
    this.activeRevalidations.clear();
    this.metrics.invalidations += size;

    if (this.isRedisConnected && this.redisClient) {
      this.redisClient.flushDb().catch(() => {});
    }

    return size;
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (const [key, timestamp] of this.keyAccessTimestamps.entries()) {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.purgeKey(oldestKey);
    }
  }

  /**
   * Evict hard-expired entries
   */
  evictExpired() {
    const now = Date.now();
    const hardExpiryCutoff = now - this.swrGraceSeconds * 1000;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < hardExpiryCutoff) {
        this.purgeKey(key);
      }
    }
  }

  /**
   * Schedule non-blocking background revalidation
   */
  async scheduleBackgroundRevalidation(key, tags, ttlSeconds, renderFn) {
    if (this.activeRevalidations.has(key)) return;

    this.activeRevalidations.add(key);
    try {
      const renderResult = await renderFn();
      const content = typeof renderResult === "object" && renderResult.content !== undefined
        ? renderResult.content
        : renderResult;

      const headers = typeof renderResult === "object" && renderResult.headers
        ? renderResult.headers
        : { "Content-Type": "text/html; charset=utf-8" };

      this.set({
        key,
        content,
        tags,
        ttlSeconds,
        headers,
      });
    } catch (err) {
      // Background revalidation error swallowed
    } finally {
      this.activeRevalidations.delete(key);
    }
  }

  /**
   * Get metrics and health status
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRatePercent = totalRequests > 0
      ? ((this.metrics.hits / totalRequests) * 100).toFixed(2)
      : "0.00";

    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      totalTags: this.tagsIndex.size,
      redisConnected: this.isRedisConnected,
      hitRate: `${hitRatePercent}%`,
      ...this.metrics,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.redisClient) {
      this.redisClient.disconnect().catch(() => {});
    }
  }
}

export const renderCacheService = new RenderCacheService({
  maxItems: 5000,
  defaultTtlSeconds: 1800, // 30 minutes
  swrGraceSeconds: 600, // 10 minutes SWR
});

export default renderCacheService;
