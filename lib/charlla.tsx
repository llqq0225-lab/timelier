/** 찰나 링크/코드 → 재생용 주소. 유튜브 등 다른 링크는 그대로 둠 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = url.trim();
  const charlla = s.match(/charlla\.io\/(?:[^/?#]+\/)*([A-Za-z0-9_-]+)/);
  if (charlla) return `https://player.charlla.io/${charlla[1]}`;
  if (/^[A-Za-z0-9_-]{6,20}$/.test(s)) return `https://player.charlla.io/${s}`; // 코드만 넣은 경우
  const yt = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return s;
}

export function VideoFrame({ url, title }: { url: string; title?: string }) {
  const src = videoEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="mx-auto max-w-[420px] aspect-[9/16] overflow-hidden rounded-2xl bg-black">
      <iframe
        src={src}
        title={title ?? '출고영상'}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
