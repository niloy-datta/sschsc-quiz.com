import type { MetadataRoute } from 'next';

const staticRoutes = [
  '/',
  '/ssc',
  '/hsc',
  '/ssc/physics',
  '/ssc/chemistry',
  '/ssc/biology',
  '/ssc/higher-math',
  '/ssc/math',
  '/hsc/physics-1st-paper',
  '/hsc/physics-2nd-paper',
  '/hsc/chemistry-1st-paper',
  '/hsc/chemistry-2nd-paper',
  '/hsc/biology-1st-paper',
  '/hsc/biology-2nd-paper',
  '/hsc/higher-math-1st-paper',
  '/hsc/higher-math-2nd-paper',
  '/leaderboard',
  '/login',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sschsc-quiz.com').replace(/\/$/, '');
  const now = new Date();

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }));
}
