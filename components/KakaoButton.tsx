'use client';

import { useCurrentProduct } from '@/lib/local-store';
import { toast } from './Toaster';
import KakaoLink from './KakaoLink';
import type { KakaoUrls } from '@/lib/kakao';

function KakaoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.84 5.32 4.62 6.74l-.96 3.5c-.08.31.27.56.54.38l4.16-2.76c.54.06 1.08.09 1.64.09 5.52 0 10-3.58 10-8S17.52 3 12 3z"
      />
    </svg>
  );
}

/** 카톡 버튼: 누르면 상품명을 복사해두고 카톡 상담창을 염 */
async function copyProduct(name: string | null | undefined) {
  if (!name) return;
  const text = `[상품 문의] ${name}\n${window.location.href}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('상품명이 복사됐어요. 카톡창에 붙여넣기 해주세요');
  } catch {
    /* 복사가 막힌 브라우저는 그냥 카톡만 열림 */
  }
}

/** 상품 상세의 상담 버튼 (금색) */
export function KakaoBar({ urls, productName }: { urls: KakaoUrls; productName?: string }) {
  return (
    <KakaoLink urls={urls} onClick={() => copyProduct(productName)} className="cta-solid w-full">
      Private Consultation
    </KakaoLink>
  );
}

/** 오른쪽 아래 떠있는 상담 버튼. 상품 상세에서는 그 상품명을 복사 */
export function KakaoFloat({ urls }: { urls: KakaoUrls }) {
  const current = useCurrentProduct();
  return (
    <KakaoLink
      urls={urls}
      onClick={() => copyProduct(current)}
      aria-label="프라이빗 상담"
      className="app-fixed-r fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex h-12 items-center gap-2.5 rounded-full border border-accent/60 bg-abyss/90 px-3.5 text-accent shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h16v11H8l-4 3z" />
      </svg>
      <span className="hidden font-display text-[10.5px] font-medium uppercase tracking-[0.25em]">Concierge</span>
    </KakaoLink>
  );
}

export { KakaoIcon };
