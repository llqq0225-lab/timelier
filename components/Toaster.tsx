'use client';

import { useEffect, useState } from 'react';

/** 화면 아래에 잠깐 뜨는 안내 문구. 어디서든 toast('문구')로 호출 */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('da-toast', { detail: message }));
}

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener('da-toast', on);
    return () => window.removeEventListener('da-toast', on);
  }, []);
  return (
    <div
      aria-live="polite"
      className={`app-center pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-300 ${
        msg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {msg && <p className="rounded-full bg-accent/90 px-5 py-3 text-sm text-paper shadow-lg whitespace-nowrap">{msg}</p>}
    </div>
  );
}
