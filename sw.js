self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Параметры файла
const FILE_SIZE   = 30 * 1024 * 1024; // 30 МБ для наглядности
const CHUNK_SIZE  = 64 * 1024;       // 64 КБ
const SPEED_DELAY = 300;            // 300 мс на кусок

// Перехват запросов к "/lol.zip"
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('lol.zip')) {
    event.respondWith(fakeSlowDownload());
  }
});

function fakeSlowDownload() {
  const stream = new ReadableStream({
    start(controller) {
      let bytesSent = 0;
      function pushChunk() {
        if (bytesSent >= FILE_SIZE) {
          controller.close();
          return;
        }
        const chunk = new Uint8Array(CHUNK_SIZE);
        bytesSent += CHUNK_SIZE;
        setTimeout(() => {
          controller.enqueue(chunk);
          pushChunk();
        }, SPEED_DELAY);
      }
      pushChunk();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=lol.zip'
    }
  });
}
