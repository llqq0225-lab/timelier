'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/** 페이지 볼 때마다 접속 기록 1줄 (이름·IP 없이, 브라우저별 무작위 번호만) */
export default function Tracker() {
  const path = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!path || last.current === path) return;
    last.current = path;
    if (navigator.webdriver) return; // 검색로봇·자동화 제외

    let visitor = '';
    let ref = '';
    try {
      if (localStorage.getItem('da_admin')) return; // 관리자 기기는 통계 제외
      visitor = localStorage.getItem('da_vid') ?? '';
      if (!visitor) {
        visitor = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('da_vid', visitor);
      }
      // 들어온 곳은 이번 방문의 첫 페이지에서만 (다른 사이트에서 왔을 때)
      if (!sessionStorage.getItem('da_ref_done')) {
        sessionStorage.setItem('da_ref_done', '1');
        if (document.referrer && !document.referrer.startsWith(location.origin)) ref = document.referrer;
      }
    } catch {
      return; // 저장 막힌 브라우저는 기록 안 함
    }

    const m = path.match(/^\/product\/(\d+)/);
    createClient()
      .rpc('track_view', {
        p_visitor: visitor,
        p_path: path,
        p_product: m ? Number(m[1]) : null,
        p_ref: ref,
        p_device: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'mobile' : 'pc',
      })
      .then(() => {});
  }, [path]);

  return null;
}
