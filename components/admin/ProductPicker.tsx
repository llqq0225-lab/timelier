'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Hit = { id: number; name: string; thumbnail_url: string | null };

/** 상품 이름으로 검색해서 고르기. 선택값은 hidden 칸(name)에 들어감 */
export default function ProductPicker({ name = 'product_id', initialId }: { name?: string; initialId?: number | null }) {
  const [selected, setSelected] = useState<Hit | null>(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    if (!initialId) return;
    createClient()
      .from('products')
      .select('id, name, thumbnail_url')
      .eq('id', initialId)
      .maybeSingle()
      .then(({ data }) => data && setSelected(data));
  }, [initialId]);

  useEffect(() => {
    const w = q.replace(/[%,()]/g, ' ').trim();
    if (w.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      let query = createClient().from('products').select('id, name, thumbnail_url').limit(8);
      for (const part of w.split(/\s+/).slice(0, 4)) query = query.ilike('name', `%${part}%`);
      const { data } = await query;
      setHits(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <input type="hidden" name={name} value={selected?.id ?? ''} />
      {selected ? (
        <div className="flex items-center gap-3 rounded border border-line p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {selected.thumbnail_url && <img src={selected.thumbnail_url} alt="" className="h-10 w-10 rounded object-cover" />}
          <span className="flex-1 text-sm">{selected.name}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-xs text-red-600">연결 해제</button>
        </div>
      ) : (
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="상품명으로 검색 (예: 데이토나 금통)" />
          {hits.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-line bg-white shadow-lg">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(h);
                      setQ('');
                      setHits([]);
                    }}
                    className="flex w-full items-center gap-3 p-2 text-left text-sm hover:bg-neutral-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.thumbnail_url && <img src={h.thumbnail_url} alt="" className="h-9 w-9 rounded object-cover" />}
                    {h.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
