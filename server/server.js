'use strict';
/* Punto de entrada para ejecutar en un servidor propio: node server/server.js
   Si están definidas SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, los datos se guardan en Supabase;
   si no, en un archivo JSON local (DATA_FILE). */
const http = require('node:http');
const path = require('node:path');
const { createStore } = require('./store');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');

const store = useSupabase
  ? require('./supabase-store').createSupabaseStore({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY })
  : createStore(DATA_FILE);
if (!useSupabase) store.flushNow();

const handler = createApp(store, {
  teacherCode: process.env.TEACHER_CODE,
  secureCookies: process.env.SECURE_COOKIES === '1',
  trustProxy: process.env.TRUST_PROXY === '1',
});

const server = http.createServer(handler);
server.listen(PORT, () => {
  console.log(`QA Academy escuchando en http://localhost:${PORT}`);
  console.log(useSupabase ? `Datos: Supabase (${process.env.SUPABASE_URL})` : `Datos: ${DATA_FILE}`);
});

const shutdown = () => { if (store.flushNow) store.flushNow(); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
