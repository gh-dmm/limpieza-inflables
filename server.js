const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// ⚠️ CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wedwaqouqbthmwlyguge.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZHdhcW91cWJ0aG13bHlndWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjY3MjcsImV4cCI6MjEwMTcwMjcyN30.rnq5eES-TYLI5OQsiugBHf5WfBvphnMZab7pB_geVlU';
const SUPABASE_HOST = new URL(SUPABASE_URL).host;

// Tipos MIME para tus archivos del frontend
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(payload));
}

function fetchFromSupabase(path, method, bodyPayload = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SUPABASE_HOST,
            path: path,
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', err => reject(err));

        if (bodyPayload) {
            req.write(JSON.stringify(bodyPayload));
        }
        req.end();
    });
}

// Función para servir archivos estáticos (index.html, code.js, style.css, etc.)
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Archivo no encontrado</h1>');
            } else {
                res.writeHead(500);
                res.end(`Error del servidor: ${err.code}`);
            }
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    // CORS preflight
    if (req.method === 'OPTIONS') {
        sendJson(res, 204, null);
        return;
    }

    // --- 1. RUTAS DE LA API ---
    if (requestUrl.pathname === '/api/inflables') {
        if (req.method === 'GET') {
            try {
                const response = await fetchFromSupabase('/rest/v1/inflables?select=*&order=id.asc', 'GET');
                if (response.status >= 400) {
                    sendJson(res, response.status, { error: 'Error en Supabase', details: response.body });
                } else {
                    sendJson(res, 200, response.body);
                }
            } catch (err) {
                sendJson(res, 500, { error: 'Error leyendo la base de datos' });
            }
            return;
        }

        if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const incoming = JSON.parse(body || '[]');
                    if (!Array.isArray(incoming)) {
                        sendJson(res, 400, { error: 'Se esperaba un arreglo' });
                        return;
                    }

                    const response = await fetchFromSupabase('/rest/v1/inflables?on_conflict=id', 'POST', incoming);
                    if (response.status >= 400) {
                        sendJson(res, response.status, { error: 'Error guardando en Supabase', details: response.body });
                    } else {
                        sendJson(res, 200, { ok: true, data: response.body });
                    }
                } catch (err) {
                    sendJson(res, 400, { error: 'Payload inválido o fallo en actualización' });
                }
            });
            return;
        }
    }

    if (requestUrl.pathname === '/api/health') {
        sendJson(res, 200, { ok: true });
        return;
    }

    // --- 2. SERVIDOR DE ARCHIVOS ESTÁTICOS (FRONTEND) ---
    // Si la ruta no empieza con /api/, servimos los archivos de la carpeta actual
    let filePath = path.join(__dirname, requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname);
    serveStaticFile(res, filePath);
});

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`- Frontend disponible en la raíz (/)`);
    console.log(`- API disponible en (/api/inflables)`);
});