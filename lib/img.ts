/**
 * 작은 사진(썸네일) 주소.
 * 관리자에서 새로 올린 사진은 원본(...-o.webp)과 작은 사진(...-t.webp)이 같이 저장돼요.
 * 목록·카드처럼 작게 보이는 곳은 작은 사진을 써서 빨리 뜨게 함. 예전 사진은 그대로.
 */
export function thumb(url?: string | null): string {
  if (!url) return '';
  return url.replace(/-o\.(webp|jpg)$/, '-t.$1');
}
