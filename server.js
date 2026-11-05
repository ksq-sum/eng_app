import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { audioFiles } from './audio.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const files = new Set(['index.html', 'styles.css', 'app.js', 'lessons.js', 'icons.js', 'state.js', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']);
files.add('audio.js');
files.add('audio_edge.js');
files.add('picturebook.js');
files.add('chapter-one.js');
files.add('book-art.js');
files.add('book-reader.js');
files.add('book.css');
files.add('story-stage.js');
files.add('theatre.css');
['back.png', 'boy.png', 'huakuang.png'].forEach((filename) => files.add(`pic/${filename}`));
audioFiles.forEach((filename) => files.add(filename.slice(2)));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav' };
const port = Number(process.env.PORT || 5188);
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!files.has(filename)) { response.writeHead(404); response.end('Not found'); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
    const content = await readFile(path.join(root, filename));
    const contentType = types[path.extname(filename)];
    response.writeHead(200, { 'Content-Type': `${contentType}${contentType.startsWith('text/') || filename.endsWith('webmanifest') ? '; charset=utf-8' : ''}`, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(500); response.end('Unable to serve file'); }
});
server.on('error', (error) => { console.error(`启动失败：${error.message}`); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => { console.log(`小步英语已启动：http://127.0.0.1:${port}\n手机预览：同一 Wi-Fi 下打开 http://电脑局域网IP:${port}`); });
