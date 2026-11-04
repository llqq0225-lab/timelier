import BrandRow from '@/components/admin/BrandRow';
import CollectionImages from '@/components/admin/CollectionImages';
import Toaster from '@/components/Toaster';
import AddBrand from '@/components/admin/AddBrand';
import { createClient } from '@/lib/supabase/server';
import type { Brand, BrandCollection } from '@/lib/types';

export default async function AdminBrands() {
  const supabase = await createClient();
  const [{ data }, { data: cols }, { data: custom }, { data: thumbs }] = await Promise.all([
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
    supabase.from('collection_images').select('*'),
    supabase.from('products').select('brand_id, collection, thumbnail_url').not('collection', 'is', null).order('view_count', { ascending: false }).limit(3000),
  ]);

  // 자동 이미지 = 그 모델에서 가장 많이 본 상품 사진
  const auto = new Map<string, string>();
  for (const t of (thumbs ?? []) as { brand_id: number; collection: string; thumbnail_url: string | null }[]) {
    const k = `${t.brand_id}|${t.collection}`;
    if (t.thumbnail_url && !auto.has(k)) auto.set(k, t.thumbnail_url);
  }
  const customMap = new Map(((custom ?? []) as { brand_id: number; collection: string; image_url: string }[]).map((c) => [`${c.brand_id}|${c.collection}`, c.image_url]));

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">브랜드 · 로고 · 모델 이미지</h1>
      <p className="text-sm text-neutral-500 mb-6">
        로고는 정사각형에 가까운 PNG(배경 투명)가 가장 깔끔해요. 모델 이미지는 브랜드 페이지의 모델 버튼에 쓰여요. 직접 안 정하면 그 모델에서 가장 많이 본 상품 사진이 자동으로 들어가요.
      </p>
      <AddBrand />
      <div className="space-y-4">
        {((data ?? []) as Brand[]).map((b) => {
          const list = ((cols ?? []) as BrandCollection[])
            .filter((c) => c.brand_id === b.id)
            .sort((x, y) => y.cnt - x.cnt)
            .map((c) => ({
              collection: c.collection,
              cnt: c.cnt,
              custom: customMap.get(`${b.id}|${c.collection}`) ?? null,
              auto: auto.get(`${b.id}|${c.collection}`) ?? null,
            }));
          return (
            <div key={b.id} className="space-y-0">
              <BrandRow brand={b} />
              <details className="border border-t-0 border-line bg-neutral-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">모델(상세분류) 이미지 {list.length}개</summary>
                <div className="pt-4">
                  <CollectionImages brandId={b.id} cols={list} />
                </div>
              </details>
            </div>
          );
        })}
      </div>
      <Toaster />
    </div>
  );
}
