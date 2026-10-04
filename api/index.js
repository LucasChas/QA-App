'use strict';
/* Función serverless de Vercel: atiende todas las rutas /api/* (ver vercel.json).
   Los archivos de public/ los sirve Vercel directamente como estáticos. */
const { createApp } = require('../server/app');
const { createSupabaseStore } = require('../server/supabase-store');

let handler = null;

function getHandler() {
  if (handler) return handler;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  handler = createApp(createSupabaseStore({ url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY }), {
    teacherCode: process.env.TEACHER_CODE,
    secureCookies: true,
    trustProxy: true,
    serveStatic: false,
  });
  return handler;
}

module.exports = async (req, res) => {
  // La reescritura de vercel.json envía /api/<ruta> como /api/index?__path=<ruta>
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/index' || url.pathname === '/api') {
    const p = url.searchParams.get('__path');
    if (p !== null) req.url = `/api/${decodeURIComponent(p).replace(/^\/+/, '')}`;
  }
  const h = getHandler();
  if (!h) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel.' }));
  }
  return h(req, res);
};
