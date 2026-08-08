import Course  from "../models/course.model.js";

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


export async function generateUniqueCourseSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (await Course.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

export function normalizeStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
}
