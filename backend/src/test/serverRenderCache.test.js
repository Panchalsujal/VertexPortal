import assert from "node:assert/strict";
import { renderCacheService } from "../service/renderCache.service.js";
import { serverRenderService } from "../service/serverRender.service.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log("================================================================");
  console.log("🚀 STARTING SERVER-RENDERED PAGE & FRAGMENT CACHING TEST SUITE 🚀");
  console.log("================================================================");

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

  // Flush clean state before tests
  renderCacheService.flushAll();

  const mockCourse = {
    _id: "64f1a2b3c4d5e6f7a8b9c0d1",
    title: "Mastering React 19 & Next.js Architecture",
    slug: "mastering-react-19",
    subtitle: "Build blazing fast scalable enterprise web applications",
    description: "Learn server-side rendering, caching, edge streaming, and micro-frontends.",
    price: 99,
    discountPrice: 49,
    level: "intermediate",
    language: "English",
    averageRating: 4.9,
    totalReviews: 240,
    enrolledStudentsCount: 1540,
    learningOutcomes: ["Master SSR & SSG", "Implement Dynamic Holes", "Optimize Latency"],
    requirements: ["Basic JavaScript knowledge"],
    category: { name: "Web Development", slug: "web-development" },
    instructor: { fullName: "Alex Rivera" },
  };

  const mockModules = [
    { title: "Introduction to Server-Driven UI", lectures: [{}, {}] },
    { title: "Edge Caching & Dynamic Hydration", lectures: [{}, {}, {}] },
  ];

  const mockCertificate = {
    _id: "64f1a2b3c4d5e6f7a8b9c0d2",
    certificateNumber: "CERT-2026-REACT-8821",
    verificationCode: "VCODE-REACT-9901",
    studentName: "Jane Doe",
    courseTitle: "Mastering React 19 & Next.js Architecture",
    instructorName: "Alex Rivera",
    status: "issued",
    issuedAt: new Date("2026-06-15T10:00:00.000Z"),
  };

  // ----------------------------------------------------------------------
  // Test 1: Cold Render vs Warm Cache Latency Benchmark
  // ----------------------------------------------------------------------
  await test("Cold render vs Warm cache latency demonstrates massive speedup (>90% faster)", async () => {
    let renderCount = 0;
    const cacheKey = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: mockCourse.slug },
      locale: "en",
    });

    // 1. Cold Render (simulating 60ms database + template rendering work)
    const t0 = performance.now();
    const coldResult = await renderCacheService.getOrRender({
      key: cacheKey,
      tags: [`course:${mockCourse.slug}`, "catalog"],
      ttlSeconds: 60,
      renderFn: async () => {
        renderCount++;
        await sleep(60); // Simulated DB query + SSR compilation cost
        return serverRenderService.renderCourseDetail({
          course: mockCourse,
          modules: mockModules,
          locale: "en",
        });
      },
    });
    const coldDuration = performance.now() - t0;

    assert.equal(coldResult.isHit, false);
    assert.equal(renderCount, 1);
    assert.ok(coldDuration >= 55, `Cold render took ${coldDuration}ms`);

    // 2. Warm Cache Hit
    const t1 = performance.now();
    const warmResult = await renderCacheService.getOrRender({
      key: cacheKey,
      tags: [`course:${mockCourse.slug}`],
      ttlSeconds: 60,
      renderFn: async () => {
        renderCount++;
        await sleep(60);
        return "SHOULD_NOT_EXECUTE";
      },
    });
    const warmDuration = performance.now() - t1;

    assert.equal(warmResult.isHit, true);
    assert.equal(warmResult.isStale, false);
    assert.equal(renderCount, 1, "Render function MUST NOT be called on cache hit");
    assert.ok(warmDuration < 5, `Warm cache served in ${warmDuration}ms (expected < 5ms)`);
    assert.ok(warmResult.content.includes("Mastering React 19"));

    console.log(`    ⚡ Benchmark: Cold = ${coldDuration.toFixed(2)}ms | Warm Cache = ${warmDuration.toFixed(2)}ms | Speedup = ${(coldDuration / Math.max(warmDuration, 0.05)).toFixed(1)}x`);
  });

  // ----------------------------------------------------------------------
  // Test 2: Locale-Aware Cache Differentiation
  // ----------------------------------------------------------------------
  await test("Locale variations generate distinct cache keys and localized server renderings", async () => {
    const keyEn = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: mockCourse.slug },
      locale: "en",
    });
    const keyEs = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: mockCourse.slug },
      locale: "es",
    });
    const keyHi = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: mockCourse.slug },
      locale: "hi",
    });

    assert.notEqual(keyEn, keyEs);
    assert.notEqual(keyEs, keyHi);

    const resEn = await renderCacheService.getOrRender({
      key: keyEn,
      renderFn: async () => serverRenderService.renderCourseDetail({ course: mockCourse, locale: "en" }),
    });

    const resEs = await renderCacheService.getOrRender({
      key: keyEs,
      renderFn: async () => serverRenderService.renderCourseDetail({ course: mockCourse, locale: "es" }),
    });

    const resHi = await renderCacheService.getOrRender({
      key: keyHi,
      renderFn: async () => serverRenderService.renderCourseDetail({ course: mockCourse, locale: "hi" }),
    });

    assert.ok(resEn.content.includes("Enroll Now"));
    assert.ok(resEs.content.includes("Inscribirse Ahora"));
    assert.ok(resHi.content.includes("अभी इनरोल करें"));
  });

  // ----------------------------------------------------------------------
  // Test 3: Volatile Query Parameter Stripping & Normalization
  // ----------------------------------------------------------------------
  await test("Normalizes cache keys by ignoring tracking query params (utm_*, ref, etc.)", async () => {
    const cleanKey = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: "react-19" },
      query: { category: "web" },
      locale: "en",
    });

    const dirtyKey = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: "react-19" },
      query: {
        category: "web",
        utm_source: "google",
        utm_campaign: "summer_sale",
        ref: "twitter",
        fbclid: "IwAR123",
        _t: "16999999",
      },
      locale: "en",
    });

    assert.equal(cleanKey, dirtyKey, "Tracking parameters should be stripped to maximize cache hits");
  });

  // ----------------------------------------------------------------------
  // Test 4: Dynamic Hole Filling & Client Hydration Preservation
  // ----------------------------------------------------------------------
  await test("Dynamic holes preserve static cached HTML while personalizing authenticated regions", async () => {
    const cachedShell = serverRenderService.renderCourseDetail({
      course: mockCourse,
      modules: mockModules,
      locale: "en",
    });

    // 1. Anonymous visitor gets public CTA
    assert.ok(cachedShell.includes("Enroll Now"));
    assert.ok(cachedShell.includes("Sign In"));
    assert.ok(cachedShell.includes('data-ssr-hydrate="course-enrollment"'));

    // 2. Authenticated enrolled student gets dynamic personalized hole filled
    const personalizedHtml = serverRenderService.fillDynamicHoles(
      cachedShell,
      {
        user: { id: "user_456", fullName: "Alice Student" },
        isEnrolled: true,
        progressPercent: 75,
        courseSlug: mockCourse.slug,
      },
      "en"
    );

    assert.ok(!personalizedHtml.includes("Enroll Now"), "Public Enroll Now button should be replaced");
    assert.ok(personalizedHtml.includes("You are enrolled in this course (75% completed)"));
    assert.ok(personalizedHtml.includes("Continue Learning"));
    assert.ok(personalizedHtml.includes("Alice Student"));
    // Static course content remains intact
    assert.ok(personalizedHtml.includes("Mastering React 19"));
    assert.ok(personalizedHtml.includes("Build blazing fast scalable enterprise"));
  });

  // ----------------------------------------------------------------------
  // Test 5: Certificate Verification SSR & Hole Support
  // ----------------------------------------------------------------------
  await test("Certificate verification view is rendered and cached with tamper-evident markup", async () => {
    const certKey = renderCacheService.generateCacheKey({
      route: "certificates",
      params: { verificationCode: mockCertificate.verificationCode },
      locale: "en",
    });

    const certResult = await renderCacheService.getOrRender({
      key: certKey,
      tags: [`certificate:${mockCertificate.verificationCode}`],
      renderFn: async () => serverRenderService.renderCertificateVerification({
        certificate: mockCertificate,
        isValid: true,
        locale: "en",
      }),
    });

    assert.ok(certResult.content.includes("Official &amp; Verified Credential") || certResult.content.includes("Official & Verified Credential"));
    assert.ok(certResult.content.includes("Jane Doe"));
    assert.ok(certResult.content.includes("CERT-2026-REACT-8821"));
    assert.ok(certResult.content.includes("Download PDF Certificate"));
  });

  // ----------------------------------------------------------------------
  // Test 6: Event-Driven Targeted Cache Invalidation
  // ----------------------------------------------------------------------
  await test("Content changes (course update, certificate revocation) purge targeted cache entries", async () => {
    const courseTag = `course:${mockCourse.slug}`;
    const certTag = `certificate:${mockCertificate.verificationCode}`;

    // Verify entries exist
    const statsBefore = renderCacheService.getStats();
    assert.ok(statsBefore.size > 0);

    // Invalidate course
    const purgedCourses = renderCacheService.purgeByTag(courseTag);
    assert.ok(purgedCourses >= 1, "Should purge course entries matching tag");

    // Course cache key is now a miss
    const courseKey = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug: mockCourse.slug },
      locale: "en",
    });
    let reRendered = false;
    await renderCacheService.getOrRender({
      key: courseKey,
      tags: [courseTag],
      renderFn: async () => {
        reRendered = true;
        return "NEW_COURSE_RENDER_AFTER_UPDATE";
      },
    });
    assert.equal(reRendered, true, "Should re-render fresh content after purge");

    // Invalidate certificate
    const purgedCerts = renderCacheService.purgeByTag(certTag);
    assert.ok(purgedCerts >= 1);
  });

  // ----------------------------------------------------------------------
  // Test 7: Stale-While-Revalidate (SWR) Background Regeneration
  // ----------------------------------------------------------------------
  await test("Serves stale content immediately within SWR window while revalidating in background", async () => {
    const swrKey = "ssr:swr-test-key";
    let renderInvocationCount = 0;

    // Cache with short 1 second TTL, 5s SWR grace
    await renderCacheService.getOrRender({
      key: swrKey,
      tags: ["swr-test"],
      ttlSeconds: 1,
      renderFn: async () => {
        renderInvocationCount++;
        return "VERSION_1";
      },
    });

    assert.equal(renderInvocationCount, 1);

    // Wait 1.1s for TTL to expire into SWR window
    await sleep(1100);

    // SWR request should return stale VERSION_1 instantly without waiting for revalidation
    const swrResult = await renderCacheService.getOrRender({
      key: swrKey,
      tags: ["swr-test"],
      ttlSeconds: 1,
      renderFn: async () => {
        renderInvocationCount++;
        await sleep(30);
        return "VERSION_2_REVALIDATED";
      },
    });

    assert.equal(swrResult.isHit, true);
    assert.equal(swrResult.isStale, true);
    assert.equal(swrResult.content, "VERSION_1", "Should return stale cached version immediately");

    // Wait for background revalidation to complete
    await sleep(50);

    // Subsequent request gets fresh VERSION_2
    const freshResult = await renderCacheService.getOrRender({
      key: swrKey,
      renderFn: async () => "VERSION_3",
    });

    assert.equal(freshResult.content, "VERSION_2_REVALIDATED");
    assert.equal(freshResult.isStale, false);
  });

  // ----------------------------------------------------------------------
  // Test 8: Rendering Load & Cache Metrics Instrumentation
  // ----------------------------------------------------------------------
  await test("Tracks rendering load decrease, hits, misses, and estimated time saved", async () => {
    const stats = renderCacheService.getStats();
    assert.ok(stats.hits > 0);
    assert.ok(stats.rendersPrevented > 0);
    assert.ok(stats.estimatedMsSaved > 0);
    assert.ok(typeof stats.hitRate === "string");

    console.log(`    📊 SSR Cache Metrics: Hits = ${stats.hits} | Misses = ${stats.misses} | Renders Prevented = ${stats.rendersPrevented} | Hit Rate = ${stats.hitRate} | Est. Saved = ${stats.estimatedMsSaved}ms`);
  });

  console.log("================================================================");
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test execution failure:", err);
  process.exit(1);
});
