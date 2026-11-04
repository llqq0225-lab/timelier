import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { createClient } from '@/lib/supabase/server';
import type { BrandCollection, Brand, Product } from '@/lib/types';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: brands }, { data: cols }] = await Promise.all([
    supabase.from('products').select('*, product_images(id, url, sort_order)').eq('id', Number(id)).maybeSingle(),
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
  ]);
  const collections = [...new Set(((cols ?? []) as BrandCollection[]).map((c) => c.collection))].sort();
  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 max-w-3xl">
        <h1 className="text-2xl font-bold">상품 수정</h1>
        <Link href={`/product/${id}`} target="_blank" className="text-sm underline">사이트에서 보기 ↗</Link>
      </div>
      <ProductForm product={product as Product} brands={(brands ?? []) as Brand[]} collections={collections} />
    </div>
  );
}
