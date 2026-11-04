'use client';

import { useEffect, useState } from 'react';
import KakaoLink from './KakaoLink';
import { toast } from './Toaster';
import type { KakaoUrls } from '@/lib/kakao';

/**
 * 상품 상세 위쪽에 뜨는 검은 바: [사진] 이 상품, 궁금하면 바로 문의해보세요 · 이 제품 문의하기
 * - PC: 캡처 키(PrtSc, 맥 Shift+Cmd+3/4/5)를 누르면 바로 표시
 * - 휴대폰: 상품 사진을 지나 아래로 내리면 표시 (웹에서는 휴대폰 캡처를 알 수 없음)
 */
export default function InquiryBar({ urls, name, thumb }: { urls: KakaoUrls; name: string; thumb: string | null }) {
  const [show, setShow] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mac = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
      if (e.key === 'PrintScreen' || mac) {
        setCaptured(true);
        setShow(true);
        setClosed(false);
      }
    };
    const onScroll = () => {
      // 화면 높이의 70% 이상 내렸을 때 (사진 영역을 지난 정도)
      if (window.scrollY > window.innerHeight * 0.7) setShow(true);
      else if (!captured) setShow(false);
    };
    window.addEventListener('keyup', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [captured]);

  const visible = show && !closed;

  return (
    <div
      className={`app-fixed-xi fixed inset-x-3 top-[calc(env(safe-area-inset-top)+108px)] z-30 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-3'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 border border-rule bg-abyss/95 py-2.5 pl-2.5 pr-2 text-fg shadow-xl backdrop-blur">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug">
          {captured ? '캡처한 상품, 바로 문의해 보세요.' : '이 시계에 대해 상담받아 보세요.'}
        </p>
        <KakaoLink
          urls={urls}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`[상품 문의] ${name}\n${location.href}`);
              toast('상품명이 복사됐어요. 카톡창에 붙여넣기 해주세요');
            } catch {}
          }}
          className="shrink-0 bg-accent px-3 py-2 text-[12.5px] font-medium text-paper active:scale-95 transition-transform"
        >
          상담하기
        </KakaoLink>
        <button type="button" onClick={() => setClosed(true)} aria-label="닫기" className="shrink-0 px-1 text-lg text-white/50 active:scale-90">
          ×
        </button>
      </div>
    </div>
  );
}
