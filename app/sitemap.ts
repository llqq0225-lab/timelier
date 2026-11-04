import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, siteUrl } from '@/lib/types';

export const revalidate = 3600; // 1시간마다 새로 만듦

/** 구글·네이버에 알려줄 페이지 목록: 주소/sitemap.xml */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const settings = await getSettings(supabase);
  const base = siteUrl(settings);

  const [{ data: brands }, products] = await Promise.all([
    supabase.from('brands').select('slug'),
    (async () => {
      const rows: { id: number; updated_at: string | null }[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data } = await supabase.from('products').select('id, updated_at').eq('is_visible', true).order('id').range(from, from + 999);
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return rows;
    })(),
  ]);

  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/brands`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/brand/domestic`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/shipping`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/reviews`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/ranking`, changeFrequency: 'daily', priority: 0.6 },
    ...((brands ?? []) as { slug: string }[]).map((b) => ({ url: `${base}/brand/${b.slug}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.id}`, lastModified: p.updated_at ? new Date(p.updated_at) : undefined, changeFrequency: 'weekly' as const, priority: 0.6 })),
  ];
}
