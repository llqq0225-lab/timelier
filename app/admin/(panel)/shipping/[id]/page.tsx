import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShippingForm from '@/components/admin/ShippingForm';
import { createClient } from '@/lib/supabase/server';
import type { Brand, Shipping } from '@/lib/types';

export default async function EditShipping({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: brands }] = await Promise.all([
    supabase.from('shipping_videos').select('*').eq('id', Number(id)).maybeSingle(),
    supabase.from('brands').select('*').order('sort_order'),
  ]);
  if (!data) notFound();
  return (
    <div>
      <div className="flex items-center justify-between mb-6 max-w-3xl">
        <h1 className="text-2xl font-bold">출고 게시물 수정</h1>
        <Link href={`/shipping/${id}`} target="_blank" className="text-sm underline">사이트에서 보기 ↗</Link>
      </div>
      <ShippingForm item={data as Shipping} brands={(brands ?? []) as Brand[]} />
    </div>
  );
}
