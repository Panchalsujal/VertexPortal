import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

/**
 * Interactive & Automated Redis Connectivity & Performance Test
 *
 * Usage:
 *   npm run test:redis
 *   OR
 *   node src/test/redisTest.js [optional_redis_url]
 */

const rawUrl = process.argv[2] || process.env.REDIS_URL;

console.log("==================================================");
console.log("🔴 VERTEX PORTAL — REDIS CONNECTIVITY & CACHE TEST");
console.log("==================================================");

if (!rawUrl) {
  console.log("⚠️  No REDIS_URL found in .env or arguments.");
  console.log("👉 How to test:");
  console.log("   1. Add to backend/.env: REDIS_URL=redis://127.0.0.1:6379 (Local)");
  console.log("      OR: REDIS_URL=rediss://default:password@your-host.upstash.io:6379 (Upstash / Cloud)");
  console.log("   2. Run: npm run test:redis\n");
  console.log("ℹ️  Note: Application is designed with Hybrid L1/L2 Cache.");
  console.log("   When REDIS_URL is not set, L1 In-Memory LRU Cache is automatically used.\n");
  process.exit(0);
}

// Clean and sanitize url
let url = rawUrl.trim();
if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
  url = url.slice(1, -1).trim();
}
const cliMatch = url.match(/redis-cli\s+(?:--tls\s+)?-u\s+(.+)/i);
if (cliMatch && cliMatch[1]) {
  url = cliMatch[1].trim();
}
if (url.includes(".upstash.io") && url.startsWith("redis://")) {
  url = url.replace(/^redis:\/\//i, "rediss://");
}

// Mask sensitive password for logs
const maskedUrl = url.replace(/(:[^:@]+)@/, ":****@");
console.log(`🔗 Target URL: ${maskedUrl}`);

async function runRedisTests() {
  const client = createClient({ url });

  client.on("error", (err) => {
    console.error(`❌ Redis Error: ${err.message}`);
  });

  try {
    // 1. Connection
    const startTime = Date.now();
    console.log("\n1️⃣  Connecting to Redis...");
    await client.connect();
    const connDuration = Date.now() - startTime;
    console.log(`   ✅ Connected successfully! (${connDuration}ms)`);

    // 2. Ping Test
    const pingStart = Date.now();
    const pingResponse = await client.ping();
    const pingLatency = Date.now() - pingStart;
    console.log(`\n2️⃣  Testing PING:`);
    console.log(`   ✅ Server Response: "${pingResponse}" (Latency: ${pingLatency}ms)`);

    // 3. Key-Value Read/Write Test
    console.log(`\n3️⃣  Testing Data Read/Write (SET & GET with TTL):`);
    const testKey = "vertex:diagnostic:test";
    const testData = JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "VertexPortal-LMS",
    });

    await client.set(testKey, testData, { EX: 60 });
    console.log(`   ✅ SET "${testKey}" (TTL: 60s)`);

    const readData = await client.get(testKey);
    const parsed = JSON.parse(readData);
    if (parsed.status === "ok") {
      console.log(`   ✅ GET verified matching payload:`, parsed);
    } else {
      throw new Error("Data payload mismatch");
    }

    // 4. Cleanup test key
    await client.del(testKey);
    console.log(`   ✅ DEL "${testKey}" (Cleanup complete)`);

    // 5. Server Info
    try {
      const info = await client.info("server");
      const versionMatch = info.match(/redis_version:([^\r\n]+)/);
      if (versionMatch) {
        console.log(`\n4️⃣  Redis Server Version: ${versionMatch[1]}`);
      }
    } catch (e) {
      // Info command may be restricted on some serverless providers
    }

    console.log("\n==================================================");
    console.log("🎉 ALL REDIS TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");

    await client.quit();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Redis Test Failed:", error.message);
    console.error("\n💡 Troubleshooting Tips:");
    console.error("   - Check if Redis server / Docker container is running.");
    console.error("   - If using Upstash/Redis Cloud, verify host, port, and password.");
    console.error("   - If using cloud TLS, use 'rediss://' protocol prefix.");
    if (client.isOpen) {
      await client.quit().catch(() => {});
    }
    process.exit(1);
  }
}

runRedisTests();
