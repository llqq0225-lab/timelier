'use client';

import { useEffect, useState } from 'react';
import { pickKakao, type KakaoUrls } from '@/lib/kakao';

/** 카톡으로 가는 모든 링크: 접속 환경에 맞는 주소를 자동으로 고름 */
export default function KakaoLink({
  urls,
  onClick,
  className,
  children,
  ...rest
}: { urls: KakaoUrls } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const [href, setHref] = useState(() => pickKakao(urls));
  useEffect(() => setHref(pickKakao(urls, navigator.userAgent)), [urls]);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // 혹시 화면이 그려지기 전에 눌러도 맞는 주소로
        const right = pickKakao(urls, navigator.userAgent);
        if (right !== href) e.currentTarget.href = right;
        onClick?.(e);
      }}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
