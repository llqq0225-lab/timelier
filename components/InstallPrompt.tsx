'use client';

import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const HIDE_KEY = 'da_install_hide';

/**
 * '홈 화면에 추가' 안내
 * - 안드로이드 크롬·삼성인터넷: [추가] 버튼 → 바로 설치창
 * - 아이폰 사파리: 공유(□↑) → 홈 화면에 추가 방법 안내
 * 두 번째 방문부터, 닫으면 14일 동안 안 뜸, 이미 앱으로 열었으면 안 뜸
 */
export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone) return;

    let visits = 0;
    try {
      const hideUntil = Number(localStorage.getItem(HIDE_KEY) || 0);
      if (Date.now() < hideUntil) return;
      if (!sessionStorage.getItem('da_visit_counted')) {
        sessionStorage.setItem('da_visit_counted', '1');
        localStorage.setItem('da_visits', String(Number(localStorage.getItem('da_visits') || 0) + 1));
      }
      visits = Number(localStorage.getItem('da_visits') || 0);
    } catch {
      return;
    }
    if (visits < 2) return; // 처음 온 사람한테는 안 띄움

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|KAKAOTALK|NAVER|Instagram/i.test(ua);
    let timer: ReturnType<typeof setTimeout>;
    if (isIos) {
      setIos(true);
      timer = setTimeout(() => setShow(true), 8000);
    }
    const onBip = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      timer = setTimeout(() => setShow(true), 8000);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now() + 14 * 24 * 3600 * 1000));
    } catch {}
  };

  if (!show || (!evt && !ios)) return null;

  return (
    <div className="app-fixed-xi fixed inset-x-3 bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[55] mx-auto max-w-sm animate-[fadeUp_.35s_ease-out] ">
      <div className="flex items-center gap-3 rounded-lg bg-paper p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">TIMELIER 앱처럼 쓰기</p>
          {ios ? (
            <p className="mt-0.5 text-[11px] leading-snug text-fg/55">
              아래 <b className="text-fg">공유 버튼(□↑)</b> → <b className="text-fg">홈 화면에 추가</b>를 누르세요
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-fg/55">홈 화면에 추가하고 바로 열어보세요</p>
          )}
        </div>
        {!ios && evt && (
          <button
            type="button"
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice.catch(() => null);
              setEvt(null);
              close();
            }}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-[12px] font-semibold text-paper active:scale-95"
          >
            추가
          </button>
        )}
        <button type="button" onClick={close} aria-label="닫기" className="shrink-0 px-1 text-lg text-fg/40 active:scale-90">×</button>
      </div>
    </div>
  );
}
