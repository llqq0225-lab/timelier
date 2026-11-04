export type Brand = {
  id: number;
  name_ko: string;
  name_en: string | null;
  slug: string;
  logo_url: string | null;
  feature_image_url: string | null;
  is_featured: boolean;
  sort_order: number;
};

export type Product = {
  id: number;
  brand_id: number | null;
  name: string;
  model_no: string | null;
  description: string | null;
  price: number | null;
  thumbnail_url: string | null;
  video_url: string | null;
  stock_type: 'order' | 'domestic';
  recent_sales: number;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  collection: string | null;
  gender: string | null;
  material?: string | null;
  strap?: string | null;
  view_count: number;
  has_video?: boolean;
  brands?: Pick<Brand, 'name_ko' | 'name_en' | 'slug'> | null;
  product_images?: { id: number; url: string; sort_order: number }[];
};

export type BrandCollection = { brand_id: number; collection: string; cnt: number };

export type Review = {
  id: number;
  product_id: number | null;
  author_name: string | null;
  content: string | null;
  image_urls: string[] | null;
  is_visible: boolean;
  created_at: string;
};

export type Notice = {
  id: number;
  title: string;
  content: string | null;
  is_pinned: boolean;
  is_visible: boolean;
  created_at: string;
};

export type Shipping = {
  id: number;
  brand_id: number | null;
  product_id: number | null;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  images: string[] | null;
  shipped_at: string;
  is_visible: boolean;
  created_at: string;
};

export function formatPrice(price: number | null) {
  return price ? `${price.toLocaleString('ko-KR')}원` : '가격 문의';
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export function kakaoOf(settings: Record<string, string>) {
  return { friend: settings.kakao_url || null, openchat: settings.kakao_openchat_url || null };
}

export async function getSettings(
  supabase: { from: (t: string) => any }
): Promise<Record<string, string>> {
  const { data } = await supabase.from('site_settings').select('key, value');
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
}

/** 사이트 기본 주소 (관리자 설정 > Vercel 주소 순) */
export function siteUrl(settings: Record<string, string>) {
  const fromSettings = (settings.site_url || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//.test(fromSettings)) return fromSettings;
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return v ? `https://${v}` : 'http://localhost:3000';
}
