'use client';

import { useEffect } from 'react';

/** .reveal 요소가 화면에 들어오면 서서히 나타나게 함 */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('reveal-on');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove('reveal-on');
    };
  }, []);
  return null;
}
