/** 카톡 상담 링크 2종: 오픈채팅 / 채널 친구추가 */
export type KakaoUrls = { openchat?: string | null; friend?: string | null };

export function hasKakao(k: KakaoUrls) {
  return !!(k.openchat || k.friend);
}

/**
 * 접속 환경에 따라 링크 고르기
 * - PC → 오픈채팅
 * - 휴대폰 크롬 → 오픈채팅
 * - 그 외 휴대폰(사파리, 삼성인터넷, 카톡·네이버 앱 안 등) → 채널 친구추가
 */
export function pickKakao(k: KakaoUrls, ua?: string): string {
  const fallback = k.openchat || k.friend || '#';
  if (!ua) return k.openchat || fallback; // 서버에서 그릴 때 기본값
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|; wv\)/i.test(ua);
  const chrome = !inApp && (/CriOS/i.test(ua) || (/Chrome\//.test(ua) && !/Edg|OPR|SamsungBrowser|Whale/i.test(ua)));
  if (!mobile || chrome) return k.openchat || fallback;
  return k.friend || fallback;
}
