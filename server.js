const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'inflables.json');

const initialData = [
    { id: 1, nombre: 'Castillo', rentas: 0, estado: 'limpio' },
    { id: 2, nombre: 'Unicornios', rentas: 0, estado: 'limpio' },
    { id: 3, nombre: 'Princesas', rentas: 0, estado: 'limpio' },
    { id: 4, nombre: 'Doble resbaladilla', rentas: 0, estado: 'limpio' },
    { id: 5, nombre: 'Paw patrol', rentas: 0, estado: 'limpio' },
    { id: 6, nombre: 'Bluey', rentas: 0, estado: 'limpio' },
    { id: 7, nombre: 'Mickey', rentas: 0, estado: 'limpio' },
    { id: 8, nombre: 'Dinosaurios', rentas: 0, estado: 'limpio' },
    { id: 9, nombre: 'Multi-interactivo', rentas: 0, estado: 'limpio' },
    { id: 10, nombre: 'Mario', rentas: 0, estado: 'limpio' },
    { id: 11, nombre: 'Spiderman', rentas: 0, estado: 'limpio' }
];

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

function readInflables() {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    try {
        return JSON.parse(content);
    } catch (err) {
        return initialData;
    }
}

function writeInflables(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

function staticFileMime(file) {
    const ext = path.extname(file).toLowerCase();
    const mimeMap = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.ico': 'image/x-icon'
    };

    return mimeMap[ext] || 'application/octet-stream';
}

function serveStatic(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const safePath = path.normalize(pathname).replace(/^([.][.][\/\\])+/, '');
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            sendJson(res, 404, { error: 'File not found' });
            return;
        }

        res.writeHead(200, {
            'Content-Type': staticFileMime(filePath),
            'Cache-Control': 'no-store'
        });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname === '/api/inflables') {
        if (req.method === 'GET') {
            sendJson(res, 200, readInflables());
            return;
        }

        if (req.method === 'PUT') {
            let body = '';

            req.on('data', chunk => {
                body += chunk;
            });

            req.on('end', () => {
                try {
                    const incoming = JSON.parse(body || '[]');
                    if (!Array.isArray(incoming)) {
                        sendJson(res, 400, { error: 'Expected array' });
                        return;
                    }

                    writeInflables(incoming);
                    sendJson(res, 200, { ok: true, data: incoming });
                } catch (err) {
                    sendJson(res, 400, { error: 'Invalid payload' });
                }
            });

            return;
        }
    }

    if (requestUrl.pathname === '/api/health') {
        sendJson(res, 200, { ok: true });
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`Limpieza Inflables server running at http://localhost:${PORT}`);
});
