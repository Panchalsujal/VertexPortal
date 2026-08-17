import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const rawUrl = process.env.REDIS_URL;

if (!rawUrl) {
  console.log("No REDIS_URL found in .env");
  process.exit(1);
}

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

async function seedKeys() {
  const client = createClient({ url });
  await client.connect();

  console.log("Connected to Upstash Redis!");

  // Sample Cache Keys
  const sampleEntries = [
    {
      key: "ssr:course:mastering-react-19:en:anon",
      data: {
        content: "<div class='course-hero'><h1>Mastering React 19</h1><p>Full-Stack Architecture Course</p></div>",
        tags: ["course:mastering-react-19", "catalog"],
        generatedAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000,
      },
      ttl: 3600,
    },
    {
      key: "ssr:certificate:CERT-98234-VRX:en:anon",
      data: {
        content: "<div class='cert-badge'><h3>Verified Certificate</h3><p>Recipient: Sujal Panchal</p></div>",
        tags: ["certificate:CERT-98234-VRX"],
        generatedAt: Date.now(),
        expiresAt: Date.now() + 7200 * 1000,
      },
      ttl: 7200,
    },
    {
      key: "api:stats:dashboard",
      data: {
        totalStudents: 1420,
        activeCourses: 38,
        serverHealth: "100%",
        updatedAt: new Date().toISOString(),
      },
      ttl: 3600,
    },
  ];

  for (const item of sampleEntries) {
    await client.setEx(item.key, item.ttl, JSON.stringify(item.data));
    console.log(`✅ Stored key: ${item.key} (TTL: ${item.ttl}s)`);
  }

  await client.quit();
  console.log("\nDone! Please refresh the Upstash Data Browser tab.");
}

seedKeys().catch(console.error);
