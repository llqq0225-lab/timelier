// 홈 화면 앱용 최소 서비스워커: 안드로이드 '앱 설치'를 켜기 위한 것. 캐시는 하지 않음(항상 최신 화면).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
