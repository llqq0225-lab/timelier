import ShippingForm from '@/components/admin/ShippingForm';
import { createClient } from '@/lib/supabase/server';
import type { Brand } from '@/lib/types';

export default async function NewShipping() {
  const supabase = await createClient();
  const { data: brands } = await supabase.from('brands').select('*').order('sort_order');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">출고 게시물 등록</h1>
      <ShippingForm brands={(brands ?? []) as Brand[]} />
    </div>
  );
}
