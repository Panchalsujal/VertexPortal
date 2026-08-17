/**
 * Utilities for optimizing images from ImageKit, Google CDN, and other external sources.
 */

export function getOptimizedImageUrl(url, { width = 500, quality = 80, format = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;

  // Optimize ImageKit URLs
  if (url.includes('ik.imagekit.io')) {
    const separator = url.includes('?') ? '&' : '?';
    // If transformation parameters already exist, don't duplicate
    if (url.includes('tr=')) return url;
    return `${url}${separator}tr=w-${width},q-${quality},f-${format}`;
  }

  // Optimize Google User Avatar URLs (lh3.googleusercontent.com)
  if (url.includes('googleusercontent.com') && url.includes('=s')) {
    return url.replace(/=s\d+(-c)?/, `=s${Math.min(width, 128)}-c`);
  }

  return url;
}

export default getOptimizedImageUrl;
