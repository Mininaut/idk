self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const ONE_PB = 1024n * 1024n * 1024n * 1024n * 1024n;  
const FILE_SIZE = 72n * ONE_PB;  
const CHUNK_SIZE = 64n * 1024n;  
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('files.zip')) {
    event.respondWith(createBigFileResponse());
  }
});
function createBigFileResponse() {
  let bytesSent = 0n;
  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= FILE_SIZE) {
        controller.close();
        return;
      }
      const remaining = FILE_SIZE - bytesSent;
      const size = remaining < CHUNK_SIZE ? remaining : CHUNK_SIZE;
      const chunk = new Uint8Array(Number(size));
      bytesSent += size;
      const minDelay = 900;
      const maxDelay = 1600;
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
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
      'X-File-Size': FILE_SIZE.toString()
    }
  });
}
