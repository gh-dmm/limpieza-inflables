const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;

// ⚠️ CONFIGURACIÓN DE SUPABASE: Reemplaza con tus credenciales reales o variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wedwaqouqbthmwlyguge.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZHdhcW91cWJ0aG13bHlndWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjY3MjcsImV4cCI6MjEwMTcwMjcyN30.rnq5eES-TYLI5OQsiugBHf5WfBvphnMZab7pB_geVlU';

// Extraer el host de la URL de Supabase (ej: "xyz.supabase.co")
const SUPABASE_HOST = new URL(SUPABASE_URL).host;

// Función auxiliar para habilitar CORS y responder en formato JSON
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

// Función para consultar datos en Supabase mediante HTTPS nativo
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
                // CORRECCIÓN CRÍTICA: Se añade resolution=merge-duplicates para habilitar UPSERT real en PostgreSQL
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

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    // Manejar peticiones de pre-vuelo (Preflight OPTIONS) requeridas por CORS
    if (req.method === 'OPTIONS') {
        sendJson(res, 204, null);
        return;
    }

    if (requestUrl.pathname === '/api/inflables') {
        // GET: Leer datos ordenados por ID de la base de datos
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

        // PUT: Actualización o inserción masiva (Upsert) en la base de datos
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

                    // CORRECCIÓN CRÍTICA: Se agrega el parámetro on_conflict=id en el path para indicar la clave única
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

    sendJson(res, 404, { error: 'Endpoint no encontrado' });
});

server.listen(PORT, () => {
    console.log(`Servidor de API ejecutándose en el puerto ${PORT}`);
});