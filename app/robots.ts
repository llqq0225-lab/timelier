import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, siteUrl } from '@/lib/types';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl(await getSettings(createPublicClient()));
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/wishlist'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
