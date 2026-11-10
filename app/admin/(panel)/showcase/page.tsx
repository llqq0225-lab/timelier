import ShowcaseEditor from '@/components/admin/ShowcaseEditor';
import { createClient } from '@/lib/supabase/server';
import { parseShowcases } from '@/lib/showcase';

export default async function AdminShowcase() {
  const supabase = await createClient();
  const [{ data: setting }, { data: brands }, { data: cols }, { data: products }] = await Promise.all([
    supabase.from('site_settings').select('value').eq('key', 'home_showcases').maybeSingle(),
    supabase.from('brands').select('id, name_ko, name_en').order('sort_order'),
    supabase.from('brand_collections').select('*'),
    supabase.from('products').select('id, name, model_no, thumbnail_url, brand_id, collection').order('sort_order').order('created_at', { ascending: false }),
  ]);
  const saved = parseShowcases(setting?.value);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">메인 제품 줄 (배너 + 리스트)</h1>
      <p className="text-sm text-neutral-500 mb-6">
        메인 화면 중간에 나오는 <b>가로 배너 사진 + 옆으로 넘기는 제품 리스트</b>예요. 묶음마다 배너 사진과 제목을 넣고, 보여줄 제품을
        <b> 브랜드·모델로 자동</b> 또는 <b>직접 골라서</b> 정할 수 있어요.
        {!saved && ' 아직 저장한 적이 없어서, 지금은 상품이 가장 많은 모델 3개가 자동으로 나오고 있어요.'}
      </p>
      <ShowcaseEditor
        initial={saved ?? []}
        brands={(brands ?? []) as { id: number; name_ko: string; name_en: string | null }[]}
        cols={(cols ?? []) as { brand_id: number; collection: string; cnt: number }[]}
        products={(products ?? []) as { id: number; name: string; model_no: string | null; thumbnail_url: string | null; brand_id: number | null; collection: string | null }[]}
      />
    </div>
  );
}
