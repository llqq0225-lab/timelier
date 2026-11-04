'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addRecent, setCurrentProduct, type SavedItem } from '@/lib/local-store';

/** 상품 상세를 열면: 최근 본 상품에 추가 + 조회수 +1 + 카톡 버튼에 상품명 전달 */
export default function RecentRecorder({ item }: { item: SavedItem }) {
  useEffect(() => {
    addRecent(item);
    setCurrentProduct(item.name);

    // 같은 상품을 새로고침할 때마다 올라가지 않게, 한 번 연 탭에서는 1번만
    const key = `da_viewed_${item.id}`;
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        createClient().rpc('increment_view', { pid: item.id }).then(() => {});
      }
    } catch {
      /* 무시 */
    }
    return () => setCurrentProduct(null);
  }, [item]);
  return null;
}
