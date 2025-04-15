self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const FILE_SIZE  = 500 * 1024 * 1024;
const CHUNK_SIZE = 64 * 1024;
const SPEED_MS   = 100;
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('files.zip')) {
    event.respondWith(createBigFileResponse());
  }
});

function createBigFileResponse() {
  let bytesSent = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= FILE_SIZE) {
        controller.close();
        return;
      }
      const remaining = FILE_SIZE - bytesSent;
      const size = Math.min(remaining, CHUNK_SIZE);
      const chunk = new Uint8Array(size);
      bytesSent += size;
      return new Promise(resolve => {
        setTimeout(() => {
          controller.enqueue(chunk);
          resolve();
        }, SPEED_MS);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="files.zip"',
      'Content-Length': FILE_SIZE
    }
  });
}
