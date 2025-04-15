self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const SAFE_CONTENT_LENGTH = 72 * 1024 * 1024 * 1024 * 1024 * 1024; // 72 PB
const CHUNK_SIZE          = 64n * 1024n;                           // 64 KB
const MIN_DELAY_MS        = 900;                                   // 70 KB/sec
const MAX_DELAY_MS        = 1600;                                  // 40 KB/sec

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('files.zip')) {
    event.respondWith(fakeBigFileResponse());
  }
});

function fakeBigFileResponse() {
  let bytesSent = 0n;
  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= SAFE_CONTENT_LENGTH) {
        controller.close();
        return;
      }
      const remaining = SAFE_CONTENT_LENGTH - bytesSent;
      const size = remaining < CHUNK_SIZE ? remaining : CHUNK_SIZE;
      const chunk = new Uint8Array(Number(size));
      bytesSent += size;
      const randomDelay = Math.floor(
        Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)
      ) + MIN_DELAY_MS;
      return new Promise(resolve => {
        setTimeout(() => {
          controller.enqueue(chunk);
          resolve();
        }, randomDelay);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="files.zip"',
      'Content-Length': SAFE_CONTENT_LENGTH.toString()
    }
  });
}
