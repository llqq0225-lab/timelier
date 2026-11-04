'use client';

import { toast } from './Toaster';

/** 공유: 휴대폰은 공유창(카톡 등), PC는 링크 복사 */
export default function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // 취소
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('링크가 복사됐어요');
    } catch {
      toast('링크 복사에 실패했어요');
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label="공유하기"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-rule active:scale-90 transition"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-fg/65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
    </button>
  );
}
