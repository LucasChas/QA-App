'use strict';
/* Punto de entrada: node server/server.js */
const http = require('node:http');
const path = require('node:path');
const { createStore } = require('./store');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');

const store = createStore(DATA_FILE);
store.flushNow();
const handler = createApp(store, {
  teacherCode: process.env.TEACHER_CODE,
  secureCookies: process.env.SECURE_COOKIES === '1',
});

const server = http.createServer(handler);
server.listen(PORT, () => {
  console.log(`QA Academy escuchando en http://localhost:${PORT}`);
  console.log(`Datos: ${DATA_FILE}`);
  if (!store.data.users.length) console.log('Aún no hay cuentas: la primera persona que se registre será profesor.');
});

const shutdown = () => { store.flushNow(); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
