'use client';

import { useEffect } from 'react';

/** 관리자로 로그인한 기기는 방문 통계에서 빼기 */
export default function AdminMark() {
  useEffect(() => {
    try {
      localStorage.setItem('da_admin', '1');
    } catch {}
  }, []);
  return null;
}
