'use client';

import { useSyncExternalStore } from 'react';

/** 찜·최근 본 상품: 손님 휴대폰(브라우저)에만 저장. 로그인 필요 없음 */
export type SavedItem = {
  id: number;
  name: string;
  thumb: string | null;
  brand?: string | null;
  collection?: string | null;
  brandId?: number | null;
};

const KEYS = { wish: 'da_wish', recent: 'da_recent' } as const;
type ListKey = keyof typeof KEYS;
const MAX = { wish: 200, recent: 30 };

const listeners = new Set<() => void>();
const cache: Partial<Record<ListKey, { raw: string | null; list: SavedItem[] }>> = {};

function read(key: ListKey): SavedItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEYS[key]);
  } catch {
    /* 사생활 보호 모드 등 */
  }
  const c = cache[key];
  if (c && c.raw === raw) return c.list; // 같은 배열을 돌려줘야 화면이 계속 다시 그려지지 않음
  let list: SavedItem[] = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch {
    list = [];
  }
  cache[key] = { raw, list };
  return list;
}

function write(key: ListKey, list: SavedItem[]) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(list.slice(0, MAX[key])));
  } catch {
    /* 저장 실패해도 사이트는 계속 동작 */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS.wish || e.key === KEYS.recent) cb(); // 다른 탭에서 바뀐 것도 반영
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

const EMPTY: SavedItem[] = [];

export function useList(key: ListKey) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

export function toggleWish(item: SavedItem) {
  const list = read('wish');
  const exists = list.some((i) => i.id === item.id);
  write('wish', exists ? list.filter((i) => i.id !== item.id) : [item, ...list]);
  return !exists;
}

export function removeItem(key: ListKey, id: number) {
  write(key, read(key).filter((i) => i.id !== id));
}

export function clearList(key: ListKey) {
  write(key, []);
}

export function addRecent(item: SavedItem) {
  write('recent', [item, ...read('recent').filter((i) => i.id !== item.id)]);
}

/* 지금 보고 있는 상품 (떠다니는 카톡 버튼이 상품명을 복사할 때 씀) */
let current: string | null = null;
const currentListeners = new Set<() => void>();
export function setCurrentProduct(name: string | null) {
  current = name;
  currentListeners.forEach((l) => l());
}
export function useCurrentProduct() {
  return useSyncExternalStore(
    (cb) => {
      currentListeners.add(cb);
      return () => currentListeners.delete(cb);
    },
    () => current,
    () => null
  );
}
