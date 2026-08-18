import { ApiError } from "./ApiError.js";

/**
 * Custom Error Classes for Circuit Breaker & Bulkhead Failures
 */
export class CircuitBreakerOpenError extends ApiError {
  constructor(name, resetTimeoutMs) {
    super(
      503,
      `Service '${name}' is temporarily unavailable (circuit breaker tripped open). Please try again shortly.`
    );
    this.name = "CircuitBreakerOpenError";
    this.breakerName = name;
    this.resetTimeoutMs = resetTimeoutMs;
  }
}

export class CircuitBreakerTimeoutError extends ApiError {
  constructor(name, timeoutMs) {
    super(
      504,
      `Service '${name}' timed out after ${timeoutMs}ms without responding.`
    );
    this.name = "CircuitBreakerTimeoutError";
    this.breakerName = name;
    this.timeoutMs = timeoutMs;
  }
}

export class BulkheadCapacityError extends ApiError {
  constructor(name, maxConcurrent) {
    super(
      429,
      `Service '${name}' is at peak capacity (bulkhead concurrency limit of ${maxConcurrent} reached). Please try again later.`
    );
    this.name = "BulkheadCapacityError";
    this.breakerName = name;
    this.maxConcurrent = maxConcurrent;
  }
}

/**
 * Circuit Breaker States
 */
export const CircuitState = Object.freeze({
  CLOSED: "CLOSED",       // Normal operation, all requests forwarded
  OPEN: "OPEN",           // Tripped, requests fail fast or serve fallback
  HALF_OPEN: "HALF_OPEN", // Testing recovery with canary probe requests
});

/**
 * Production-grade Circuit Breaker & Bulkhead Concurrency Controller
 */
export class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {string} options.name - Name identifier for this dependency
   * @param {number} [options.timeoutMs=10000] - Hard execution timeout in milliseconds
   * @param {number} [options.failureThreshold=4] - Consecutive failures before opening the circuit
   * @param {number} [options.resetTimeoutMs=15000] - Cool-down duration before attempting HALF_OPEN probe
   * @param {number} [options.maxConcurrent=10] - Bulkhead limit for active in-flight requests
   * @param {number} [options.halfOpenSuccessThreshold=2] - Successful probes in HALF_OPEN to close circuit
   * @param {Function} [options.fallback=null] - Default fallback function (error, ...args) => any
   */
  constructor({
    name = "default",
    timeoutMs = 10000,
    failureThreshold = 4,
    resetTimeoutMs = 15000,
    maxConcurrent = 10,
    halfOpenSuccessThreshold = 2,
    fallback = null,
  } = {}) {
    this.name = name;
    this.timeoutMs = timeoutMs;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.maxConcurrent = maxConcurrent;
    this.halfOpenSuccessThreshold = halfOpenSuccessThreshold;
    this.fallback = fallback;

    // State Tracking
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.activeRequests = 0;
    this.nextAttempt = Date.now();

    // Metrics / Observability
    this.stats = {
      totalCalls: 0,
      successes: 0,
      failures: 0,
      timeouts: 0,
      shortCircuited: 0,
      bulkheadRejections: 0,
      fallbackCalls: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      lastTrippedTime: null,
      lastErrorMessage: null,
    };
  }

  /**
   * Check whether circuit is ready to test recovery (HALF_OPEN)
   */
  _updateState() {
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
      this.state = CircuitState.HALF_OPEN;
      this.consecutiveSuccesses = 0;
      console.warn(`[CIRCUIT-BREAKER] [${this.name}] Transitioned from OPEN to HALF_OPEN (probing health)`);
    }
  }

  /**
   * Record a successful execution
   */
  _onSuccess() {
    this.stats.successes += 1;
    this.stats.lastSuccessTime = new Date().toISOString();
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses += 1;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`[CIRCUIT-BREAKER] [${this.name}] Successfully recovered! Transitioned from HALF_OPEN to CLOSED`);
      }
    }
  }

  /**
   * Record a failed execution (error or timeout)
   */
  _onFailure(error, isTimeout = false) {
    this.stats.failures += 1;
    this.stats.lastFailureTime = new Date().toISOString();
    this.stats.lastErrorMessage = error?.message || String(error);
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures += 1;

    if (isTimeout) {
      this.stats.timeouts += 1;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this._trip();
    } else if (this.state === CircuitState.CLOSED && this.consecutiveFailures >= this.failureThreshold) {
      this._trip();
    }
  }

  /**
   * Trip the circuit into OPEN state
   */
  _trip() {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeoutMs;
    this.stats.lastTrippedTime = new Date().toISOString();
    console.error(
      `[CIRCUIT-BREAKER] [${this.name}] Tripped to OPEN state! Next recovery probe in ${this.resetTimeoutMs}ms. (Consecutive failures: ${this.consecutiveFailures})`
    );
  }

  /**
   * Execute an async function through the Circuit Breaker with timeout and bulkhead limits
   *
   * @param {Function} asyncFn - Async operation returning a promise
   * @param {Object} [options]
   * @param {Function} [options.fallback] - Custom fallback override for this invocation
   * @param {Array} [options.args=[]] - Arguments to pass to asyncFn and fallback
   * @param {number} [options.timeoutMs] - Optional per-call timeout override
   * @returns {Promise<any>}
   */
  async fire(asyncFn, { fallback = null, args = [], timeoutMs = this.timeoutMs } = {}) {
    this.stats.totalCalls += 1;
    this._updateState();

    const effectiveFallback = fallback || this.fallback;

    // 1. Check Circuit State: Reject if OPEN
    if (this.state === CircuitState.OPEN) {
      this.stats.shortCircuited += 1;
      const openError = new CircuitBreakerOpenError(this.name, this.resetTimeoutMs);

      if (typeof effectiveFallback === "function") {
        this.stats.fallbackCalls += 1;
        return effectiveFallback(openError, ...args);
      }
      throw openError;
    }

    // 2. Check Bulkhead Limit: Reject if active concurrency ceiling reached
    if (this.activeRequests >= this.maxConcurrent) {
      this.stats.bulkheadRejections += 1;
      const bulkheadError = new BulkheadCapacityError(this.name, this.maxConcurrent);

      if (typeof effectiveFallback === "function") {
        this.stats.fallbackCalls += 1;
        return effectiveFallback(bulkheadError, ...args);
      }
      throw bulkheadError;
    }

    // 3. Increment Active Concurrency
    this.activeRequests += 1;

    let timer = null;
    let isTimedOut = false;

    try {
      // Execute with hard timeout promise race
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          isTimedOut = true;
          reject(new CircuitBreakerTimeoutError(this.name, timeoutMs));
        }, timeoutMs);
      });

      const result = await Promise.race([
        asyncFn(...args),
        timeoutPromise,
      ]);

      if (timer) clearTimeout(timer);
      this._onSuccess();
      return result;
    } catch (error) {
      if (timer) clearTimeout(timer);
      this._onFailure(error, isTimedOut);

      if (typeof effectiveFallback === "function") {
        this.stats.fallbackCalls += 1;
        return effectiveFallback(error, ...args);
      }
      throw error;
    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
    }
  }

  /**
   * Reset the circuit breaker to clean CLOSED state
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.activeRequests = 0;
    this.nextAttempt = Date.now();
  }

  /**
   * Get detailed current status snapshot for observability & health monitoring
   */
  getStatus() {
    this._updateState();
    return {
      name: this.name,
      state: this.state,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      timeoutMs: this.timeoutMs,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      consecutiveFailures: this.consecutiveFailures,
      stats: { ...this.stats },
      recoveryInMs: this.state === CircuitState.OPEN ? Math.max(0, this.nextAttempt - Date.now()) : 0,
    };
  }
}

/**
 * Global Circuit Breakers Registry
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  register(name, options = {}) {
    const breaker = new CircuitBreaker({ name, ...options });
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name) {
    return this.breakers.get(name);
  }

  getAllStatus() {
    const statuses = {};
    for (const [name, breaker] of this.breakers.entries()) {
      statuses[name] = breaker.getStatus();
    }
    return statuses;
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Preconfigured Breakers for All External Dependencies in NavGujarat Academy
 */
export const circuitBreakers = {
  // Mistral AI (Chat, Teaching Assistant, Quiz Generation)
  mistral: circuitBreakerRegistry.register("mistral", {
    timeoutMs: 12000,
    failureThreshold: 4,
    resetTimeoutMs: 15000,
    maxConcurrent: 12,
    halfOpenSuccessThreshold: 2,
  }),

  // Mistral Vector Embeddings (RAG / Search)
  mistralEmbedding: circuitBreakerRegistry.register("mistralEmbedding", {
    timeoutMs: 8000,
    failureThreshold: 4,
    resetTimeoutMs: 15000,
    maxConcurrent: 10,
    halfOpenSuccessThreshold: 2,
  }),

  // Email Transports (Resend, Gmail REST API, SMTP)
  mail: circuitBreakerRegistry.register("mail", {
    timeoutMs: 8000,
    failureThreshold: 3,
    resetTimeoutMs: 20000,
    maxConcurrent: 10,
    halfOpenSuccessThreshold: 2,
  }),

  // GetStream.io (Live classes, rooms, user tokens)
  stream: circuitBreakerRegistry.register("stream", {
    timeoutMs: 8000,
    failureThreshold: 4,
    resetTimeoutMs: 15000,
    maxConcurrent: 10,
    halfOpenSuccessThreshold: 2,
  }),

  // ImageKit (Media & Document Uploads)
  imagekit: circuitBreakerRegistry.register("imagekit", {
    timeoutMs: 15000,
    failureThreshold: 4,
    resetTimeoutMs: 15000,
    maxConcurrent: 8,
    halfOpenSuccessThreshold: 2,
  }),

  // Razorpay (Payment Gateways)
  razorpay: circuitBreakerRegistry.register("razorpay", {
    timeoutMs: 10000,
    failureThreshold: 4,
    resetTimeoutMs: 15000,
    maxConcurrent: 15,
    halfOpenSuccessThreshold: 2,
  }),
};
