import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIMELIER',
  description: '검수된 하이엔드 시계, 타임리에',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'TIMELIER', statusBarStyle: 'default' }, // 아이폰 홈 화면 앱
};

export const viewport: Viewport = {
  themeColor: '#1a0509',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // 아이폰 하단 여백까지 화면 사용
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
