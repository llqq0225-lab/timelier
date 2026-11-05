'use client';

import { useEffect } from 'react';

/**
 * PC(마우스)에서 옆으로 넘기는 줄을 마우스로 잡아끌어 넘길 수 있게 함.
 * 브랜드 칸, 모델 버튼, 필터 칩, 상품 사진 등 '옆으로 밀어서 보는' 곳 전부에 적용.
 * 휴대폰(손가락)에서는 아무것도 하지 않음.
 */
export default function DragScroll() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const findScroller = (t: EventTarget | null): HTMLElement | null => {
      for (let n = t as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX;
        if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 2) return n;
      }
      return null;
    };

    let el: HTMLElement | null = null;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let snap = '';

    const over = (e: MouseEvent) => {
      const s = findScroller(e.target);
      if (s && !s.dataset.dragHint) {
        s.dataset.dragHint = '1';
        s.style.cursor = 'grab';
      }
    };
    const down = (e: MouseEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('input, select, textarea')) return;
      const s = findScroller(e.target);
      if (!s) return;
      el = s;
      startX = e.clientX;
      startLeft = s.scrollLeft;
      moved = false;
      snap = s.style.scrollSnapType;
      e.preventDefault(); // 링크·사진을 끌어가는 기본 동작(드래그) 막기 — 막지 않으면 중간에 멈춤
    };
    const noNativeDrag = (e: DragEvent) => {
      if (findScroller(e.target)) e.preventDefault();
    };
    const move = (e: MouseEvent) => {
      if (!el) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) {
        moved = true;
        el.style.scrollSnapType = 'none'; // 끄는 동안은 자석 기능 끔
        el.style.scrollBehavior = 'auto';
        el.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      el.scrollLeft = startLeft - dx;
      e.preventDefault();
    };
    const up = () => {
      if (!el) return;
      const s = el;
      el = null;
      document.body.style.userSelect = '';
      s.style.cursor = 'grab';
      if (!moved) return;
      s.style.scrollBehavior = '';
      s.style.scrollSnapType = snap; // 놓으면 가장 가까운 칸에 맞춰짐
      // 끌고 난 직후의 클릭(링크 열림)은 막음
      const block = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      window.addEventListener('click', block, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', block, { capture: true }), 80);
    };

    document.addEventListener('mouseover', over);
    document.addEventListener('mousedown', down);
    document.addEventListener('dragstart', noNativeDrag);
    window.addEventListener('mousemove', move, { passive: false });
    window.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('dragstart', noNativeDrag);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);
  return null;
}
