import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings } from '@/lib/types';

export const revalidate = 300;

/** 휴대폰 '홈 화면에 추가' 정보 (앱 이름·아이콘·색). 관리자 > 사이트 설정의 아이콘을 쓰고, 없으면 기본 아이콘 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings(createPublicClient()).catch(() => ({}) as Record<string, string>);
  const name = settings.site_name || 'TIMELIER';
  const icon = settings.icon_url;
  return {
    name,
    short_name: name,
    description: settings.seo_description || '검수된 하이엔드 시계, 타임리에',
    start_url: '/?from=homescreen',
    scope: '/',
    display: 'standalone',
    background_color: '#2b0a15',
    theme_color: '#1a0509',
    lang: 'ko',
    icons: icon
      ? [
          { src: icon, sizes: '192x192' },
          { src: icon, sizes: '512x512' },
        ]
      : [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
  };
}
