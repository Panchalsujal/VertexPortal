import Course from "../models/course.model.js";

const getCanonicalFrontendUrl = () => {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.trim().replace(/\/$/, "");
  }
  const origins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((u) => u.trim().replace(/\/$/, ""))
    .filter(Boolean);

  // 1. Prioritize custom production domain
  const customDomain = origins.find((u) => u.includes("navgujaratacademy.online"));
  if (customDomain) return customDomain;

  // 2. Prioritize non-vercel, non-local domain
  const nonVercelDomain = origins.find(
    (u) => !u.includes("localhost") && !u.includes("127.0.0.1") && !u.includes("vercel.app")
  );
  if (nonVercelDomain) return nonVercelDomain;

  return origins[0] || "https://navgujaratacademy.online";
};

const FRONTEND_URL = getCanonicalFrontendUrl();

const escapeXml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const formatDate = (date) => {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split("T")[0];
};

export const generateSitemapXml = async () => {
  const courses = await Course.find({
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .select("slug updatedAt publishedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const staticPages = [
    {
      url: "/",
      changefreq: "daily",
      priority: "1.0",
    },
    {
      url: "/courses",
      changefreq: "daily",
      priority: "0.9",
    },
    {
      url: "/playground",
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      url: "/discussions",
      changefreq: "daily",
      priority: "0.8",
    },
    {
      url: "/help",
      changefreq: "monthly",
      priority: "0.6",
    },
    {
      url: "/privacy",
      changefreq: "monthly",
      priority: "0.4",
    },
    {
      url: "/terms",
      changefreq: "monthly",
      priority: "0.4",
    },
  ];

  const staticUrls = staticPages
    .map((page) => {
      return `
  <url>
    <loc>${escapeXml(`${FRONTEND_URL}${page.url}`)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join("");

  const courseUrls = courses
    .map((course) => {
      const lastModified =
        formatDate(course.updatedAt) ||
        formatDate(course.publishedAt);

      return `
  <url>
    <loc>${escapeXml(
      `${FRONTEND_URL}/courses/${encodeURIComponent(course.slug)}`,
    )}</loc>${
      lastModified
        ? `
    <lastmod>${lastModified}</lastmod>`
        : ""
    }
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${courseUrls}
</urlset>`;

  return {
    xml,
    totalCourses: courses.length,
    totalUrls: staticPages.length + courses.length,
  };
};