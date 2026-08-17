import assert from "node:assert/strict";
import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
  BulkheadCapacityError,
  circuitBreakerRegistry,
  circuitBreakers,
} from "../utils/circuitBreaker.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log("==================================================");
  console.log("⚡ STARTING CIRCUIT BREAKER & BULKHEAD TEST SUITE ⚡");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Normal successful call
  // -------------------------------------------------------------
  await test("Normal call executes successfully and tracks metrics", async () => {
    const breaker = new CircuitBreaker({ name: "test-healthy" });
    const result = await breaker.fire(async () => {
      return "service-response-data";
    });

    assert.equal(result, "service-response-data");
    const status = breaker.getStatus();
    assert.equal(status.state, CircuitState.CLOSED);
    assert.equal(status.stats.successes, 1);
    assert.equal(status.stats.failures, 0);
  });

  // -------------------------------------------------------------
  // Test 2: Timeout enforcement
  // -------------------------------------------------------------
  await test("Enforces strict timeout on hanging dependency", async () => {
    const breaker = new CircuitBreaker({
      name: "test-timeout",
      timeoutMs: 100, // 100ms timeout
    });

    const start = Date.now();
    let caughtError = null;

    try {
      await breaker.fire(async () => {
        await sleep(500); // Takes 500ms
        return "too-late";
      });
    } catch (err) {
      caughtError = err;
    }

    const elapsed = Date.now() - start;

    assert(caughtError instanceof CircuitBreakerTimeoutError);
    assert.equal(caughtError.statusCode, 504);
    assert(elapsed >= 90 && elapsed <= 250, `Elapsed time was ${elapsed}ms`);

    const status = breaker.getStatus();
    assert.equal(status.stats.timeouts, 1);
    assert.equal(status.stats.failures, 1);
  });

  // -------------------------------------------------------------
  // Test 3: Bulkhead Concurrency Limiting
  // -------------------------------------------------------------
  await test("Bulkhead immediately rejects requests exceeding concurrency limit", async () => {
    const breaker = new CircuitBreaker({
      name: "test-bulkhead",
      maxConcurrent: 2, // Only 2 concurrent requests permitted
      timeoutMs: 2000,
    });

    // Start 2 long-running tasks
    const task1 = breaker.fire(async () => {
      await sleep(150);
      return "task1-done";
    });

    const task2 = breaker.fire(async () => {
      await sleep(150);
      return "task2-done";
    });

    // Tasks 3 & 4 should be rejected immediately (0ms)
    let rejectedError = null;
    try {
      await breaker.fire(async () => {
        return "task3";
      });
    } catch (err) {
      rejectedError = err;
    }

    assert(rejectedError instanceof BulkheadCapacityError);
    assert.equal(rejectedError.statusCode, 429);

    const [res1, res2] = await Promise.all([task1, task2]);
    assert.equal(res1, "task1-done");
    assert.equal(res2, "task2-done");

    const status = breaker.getStatus();
    assert.equal(status.stats.bulkheadRejections, 1);
    assert.equal(status.stats.successes, 2);
  });

  // -------------------------------------------------------------
  // Test 4: Breaker Tripping (CLOSED -> OPEN)
  // -------------------------------------------------------------
  await test("Breaker trips to OPEN after failureThreshold is reached", async () => {
    const breaker = new CircuitBreaker({
      name: "test-trip",
      failureThreshold: 3,
      resetTimeoutMs: 200,
    });

    // 3 successive failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.fire(async () => {
          throw new Error("Upstream outage " + (i + 1));
        });
      } catch (err) {
        // Expected
      }
    }

    assert.equal(breaker.state, CircuitState.OPEN);
    const status = breaker.getStatus();
    assert.equal(status.state, CircuitState.OPEN);
    assert.equal(status.stats.failures, 3);
  });

  // -------------------------------------------------------------
  // Test 5: Fast-failing in OPEN state (< 1ms)
  // -------------------------------------------------------------
  await test("Tripped breaker fast-fails in < 1ms without hitting dependency", async () => {
    const breaker = new CircuitBreaker({
      name: "test-fast-fail",
      failureThreshold: 1,
      resetTimeoutMs: 1000,
    });

    // Trip the breaker
    try {
      await breaker.fire(async () => {
        throw new Error("Initial failure");
      });
    } catch (err) {
      // Expected
    }

    assert.equal(breaker.state, CircuitState.OPEN);

    let calledUnderlyingService = false;
    const start = Date.now();
    let fastFailError = null;

    try {
      await breaker.fire(async () => {
        calledUnderlyingService = true;
        return "should-never-run";
      });
    } catch (err) {
      fastFailError = err;
    }

    const elapsed = Date.now() - start;

    assert.equal(calledUnderlyingService, false, "Underlying service should NOT have been called");
    assert(fastFailError instanceof CircuitBreakerOpenError);
    assert.equal(fastFailError.statusCode, 503);
    assert(elapsed < 10, `Fast fail took ${elapsed}ms, expected < 10ms`);

    const status = breaker.getStatus();
    assert.equal(status.stats.shortCircuited, 1);
  });

  // -------------------------------------------------------------
  // Test 6: Serving Graceful Fallback
  // -------------------------------------------------------------
  await test("Serves graceful fallback when tripped or failing", async () => {
    const breaker = new CircuitBreaker({
      name: "test-fallback",
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      fallback: (error, arg1) => {
        return {
          degraded: true,
          message: "Fallback AI response for " + arg1,
          reason: error.message,
        };
      },
    });

    // First call fails and returns fallback
    const result1 = await breaker.fire(
      async () => {
        throw new Error("Provider down");
      },
      { args: ["Topic A"] }
    );

    assert.equal(result1.degraded, true);
    assert.equal(result1.message, "Fallback AI response for Topic A");

    // Second call is short-circuited (OPEN state) and also returns fallback
    assert.equal(breaker.state, CircuitState.OPEN);

    const result2 = await breaker.fire(
      async () => {
        return "real response";
      },
      { args: ["Topic B"] }
    );

    assert.equal(result2.degraded, true);
    assert.equal(result2.message, "Fallback AI response for Topic B");
  });

  // -------------------------------------------------------------
  // Test 7: Recovery (OPEN -> HALF_OPEN -> CLOSED)
  // -------------------------------------------------------------
  await test("Cleanly probes in HALF_OPEN and recovers to CLOSED", async () => {
    const breaker = new CircuitBreaker({
      name: "test-recovery",
      failureThreshold: 2,
      resetTimeoutMs: 100, // Short 100ms reset timeout for testing
      halfOpenSuccessThreshold: 2,
    });

    // 1. Trip breaker
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.fire(async () => {
          throw new Error("Temporary blip");
        });
      } catch (err) {}
    }

    assert.equal(breaker.state, CircuitState.OPEN);

    // 2. Wait for reset timeout to elapse
    await sleep(120);

    // 3. First probe call (should trigger HALF_OPEN transition and succeed)
    const probe1 = await breaker.fire(async () => "probe-1-ok");
    assert.equal(probe1, "probe-1-ok");
    assert.equal(breaker.state, CircuitState.HALF_OPEN);

    // 4. Second probe call (reaches halfOpenSuccessThreshold = 2, so resets to CLOSED)
    const probe2 = await breaker.fire(async () => "probe-2-ok");
    assert.equal(probe2, "probe-2-ok");
    assert.equal(breaker.state, CircuitState.CLOSED);

    const status = breaker.getStatus();
    assert.equal(status.state, CircuitState.CLOSED);
    assert.equal(status.consecutiveFailures, 0);
  });

  // -------------------------------------------------------------
  // Test 8: Preconfigured Project Breakers
  // -------------------------------------------------------------
  await test("All preconfigured project circuit breakers are registered and healthy", async () => {
    const registeredNames = [
      "mistral",
      "mistralEmbedding",
      "mail",
      "stream",
      "imagekit",
      "razorpay",
    ];

    const allStatuses = circuitBreakerRegistry.getAllStatus();

    for (const name of registeredNames) {
      assert(allStatuses[name], `Breaker '${name}' should be registered`);
      assert.equal(allStatuses[name].state, CircuitState.CLOSED);
      assert.equal(typeof circuitBreakers[name]?.fire, "function");
    }
  });

  // -------------------------------------------------------------
  // Test 9: Cascade Prevention Simulation
  // -------------------------------------------------------------
  await test("A hung dependency does not drag down unrelated application operations", async () => {
    const degradedBreaker = new CircuitBreaker({
      name: "hanging-third-party",
      timeoutMs: 100, // Timed out in 100ms
      failureThreshold: 2,
      resetTimeoutMs: 500,
    });

    // Trip the hanging dependency
    for (let i = 0; i < 2; i++) {
      try {
        await degradedBreaker.fire(async () => {
          await sleep(1000); // Simulated slow upstream
        });
      } catch (err) {}
    }

    assert.equal(degradedBreaker.state, CircuitState.OPEN);

    // Measure independent fast local / database mock operations
    const fastOperationsStart = Date.now();
    const results = await Promise.all([
      // Unrelated auth / user lookup
      Promise.resolve({ userId: "u123", role: "student" }),
      // Unrelated course listing
      Promise.resolve([{ id: "c1", title: "Node.js Architecture" }]),
      // Fast-failing degraded call (takes < 1ms)
      degradedBreaker.fire(async () => "won't run").catch((e) => e.name),
    ]);

    const totalTime = Date.now() - fastOperationsStart;

    assert.equal(results[0].userId, "u123");
    assert.equal(results[1].length, 1);
    assert.equal(results[2], "CircuitBreakerOpenError");
    assert(totalTime < 25, `Unrelated operations took ${totalTime}ms; should be under 25ms`);
  });

  // -------------------------------------------------------------
  // Test 10: Express Health Endpoint Formatting
  // -------------------------------------------------------------
  await test("Circuit breakers status endpoint formats correctly and reflects health", async () => {
    circuitBreakerRegistry.resetAll();
    const statuses = circuitBreakerRegistry.getAllStatus();

    assert.equal(typeof statuses, "object");
    assert(statuses.mistral, "mistral breaker should be present");
    assert.equal(statuses.mistral.state, CircuitState.CLOSED);

    // Trip mistral
    for (let i = 0; i < circuitBreakers.mistral.failureThreshold; i++) {
      try {
        await circuitBreakers.mistral.fire(async () => {
          throw new Error("Mistral mock failure");
        });
      } catch (err) {}
    }

    const degradedStatuses = circuitBreakerRegistry.getAllStatus();
    assert.equal(degradedStatuses.mistral.state, CircuitState.OPEN);

    const hasOpenBreakers = Object.values(degradedStatuses).some((b) => b.state === "OPEN");
    assert.equal(hasOpenBreakers, true);

    // Reset back to healthy
    circuitBreakerRegistry.resetAll();
    const resetStatuses = circuitBreakerRegistry.getAllStatus();
    assert.equal(resetStatuses.mistral.state, CircuitState.CLOSED);
  });

  console.log("==================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

