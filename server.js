const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);

  // Try as-is, then with .html extension
  const candidates = [filePath, filePath + '.html'];
  let found = candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile());

  if (!found) {
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext = path.extname(found);
  const mime = MIME[ext] || 'application/octet-stream';
  const noCache = ['.html', '.json', '.js', '.css'].includes(ext);

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': noCache ? 'no-cache, no-store' : 'public, max-age=3600',
  });
  fs.createReadStream(found).pipe(res);
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
