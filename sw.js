// -------------------------------------------------------------
// 수익률 자동 계산기 - 서비스 워커 (sw.js)
// 오프라인 실행 및 자원 캐싱을 관리합니다.
// -------------------------------------------------------------

const CACHE_NAME = 'fin-calc-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.png'
];

// 서비스 워커 설치 및 리소스 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 리소스 캐싱 중...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 서비스 워커 활성화 및 구버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] 구버전 캐시 삭제:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 캐시 우선 (Cache First) / Stale-While-Revalidate 전략으로 리소스 요청 응답
self.addEventListener('fetch', (event) => {
  // 브라우저 확장도구 등 http/https가 아닌 요청은 무시
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // 캐시된 자원이 있으면 먼저 반환하고, 백그라운드에서 캐시 업데이트 (Stale-While-Revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* 오프라인 시 조용히 실패 */});
            
          return cachedResponse;
        }

        // 캐시에 없으면 네트워크에서 가져옴
        return fetch(event.request);
      })
  );
});
