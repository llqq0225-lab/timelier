import ProductForm from '@/components/admin/ProductForm';
import { createClient } from '@/lib/supabase/server';
import type { BrandCollection, Brand } from '@/lib/types';

export default async function NewProduct() {
  const supabase = await createClient();
  const [{ data: brands }, { data: cols }] = await Promise.all([
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
  ]);
  const collections = [...new Set(((cols ?? []) as BrandCollection[]).map((c) => c.collection))].sort();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">상품 등록</h1>
      <ProductForm brands={(brands ?? []) as Brand[]} collections={collections} />
    </div>
  );
}
