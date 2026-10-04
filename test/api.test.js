'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createStore } = require('../server/store');
const { createApp } = require('../server/app');

let server;
let base;
let clock = Date.parse('2026-10-01T12:00:00Z');

before(async () => {
  const store = createStore(null);
  server = http.createServer(createApp(store, { teacherCode: 'PROFE-123', now: () => clock }));
  await new Promise(r => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

/* Cliente mínimo que conserva la cookie de sesión. */
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => null) };
  };
}

const prof = client();
const ana = client();
const beto = client();
let examId;

test('el primer usuario registrado es profesor', async () => {
  const r = await prof('POST', '/api/auth/register', { name: 'Profe Uno', email: 'profe@escuela.edu', password: 'secreto123' });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'profesor');
  assert.equal(r.body.user.password, undefined);
});

test('los siguientes usuarios son alumnos y se validan los datos', async () => {
  let r = await ana('POST', '/api/auth/register', { name: 'Ana', email: 'ana@escuela.edu', password: 'corta' });
  assert.equal(r.status, 400);
  r = await ana('POST', '/api/auth/register', { name: 'Ana', email: 'ana@escuela.edu', password: 'claveana1' });
  assert.equal(r.body.user.role, 'alumno');
  r = await beto('POST', '/api/auth/register', { name: 'Beto', email: 'ANA@escuela.edu', password: 'claveana1' });
  assert.equal(r.status, 409, 'email duplicado sin importar mayúsculas');
  r = await beto('POST', '/api/auth/register', { name: 'Beto', email: 'beto@escuela.edu', password: 'clavebeto1' });
  assert.equal(r.status, 201);
});

test('código de profesor incorrecto se rechaza', async () => {
  const r = await client()('POST', '/api/auth/register', { name: 'X', email: 'x@escuela.edu', password: 'clavexxx1', teacherCode: 'mal' });
  assert.equal(r.status, 400);
});

test('login, sesión y logout', async () => {
  const c = client();
  assert.equal((await c('GET', '/api/me')).status, 401);
  assert.equal((await c('POST', '/api/auth/login', { email: 'ana@escuela.edu', password: 'incorrecta' })).status, 401);
  const r = await c('POST', '/api/auth/login', { email: 'Ana@Escuela.edu', password: 'claveana1' });
  assert.equal(r.status, 200);
  assert.equal((await c('GET', '/api/me')).body.user.name, 'Ana');
  await c('POST', '/api/auth/logout', {});
  assert.equal((await c('GET', '/api/me')).status, 401);
});

test('el progreso se guarda saneado', async () => {
  const r = await ana('PUT', '/api/progress', { xp: 120, results: { 'tabla-decision': { best: 140, plays: 2, stars: 9 } }, badges: ['primer-paso', '<x>'] });
  assert.equal(r.status, 200);
  const me = await ana('GET', '/api/me');
  assert.deepEqual(me.body.progress.results['tabla-decision'], { best: 100, plays: 2, stars: 3, last: 0 });
  assert.deepEqual(me.body.progress.badges, ['primer-paso']);
});

test('un alumno no puede crear exámenes', async () => {
  const r = await ana('POST', '/api/exams', { title: 'x', questions: [] });
  assert.equal(r.status, 403);
});

test('el profesor crea y publica un examen; el alumno no ve las respuestas', async () => {
  let r = await prof('POST', '/api/exams', { title: 'Parcial 1', questions: [] });
  assert.equal(r.status, 400);
  r = await prof('POST', '/api/exams', {
    title: 'Parcial 1', description: 'Capítulos 1 y 2', timeLimit: 10, passPct: 50, attemptsAllowed: 1,
    showAnswers: true, published: true, assignedTo: 'all',
    questions: [
      { q: '¿2+2?', options: ['3', '4'], answer: 1, explain: 'Suma' },
      { q: '¿Error humano?', options: ['Error', 'Fallo', 'Defecto'], answer: 0 },
    ],
  });
  assert.equal(r.status, 201);
  examId = r.body.exam.id;

  const list = await ana('GET', '/api/exams');
  const seen = list.body.exams.find(e => e.id === examId);
  assert.equal(seen.status, 'disponible');
  assert.ok(!list.body.exams.some(e => e.title === 'Diagnóstico inicial de testing'), 'el borrador no se muestra');

  const start = await ana('POST', `/api/exams/${examId}/start`, {});
  assert.equal(start.status, 200);
  assert.equal(start.body.exam.questions.length, 2);
  assert.ok(start.body.exam.questions.every(q => q.answer === undefined), 'no se filtran respuestas');
  assert.equal((await ana('GET', `/api/exams/${examId}`)).status, 403);

  const again = await ana('POST', `/api/exams/${examId}/start`, {});
  assert.equal(again.body.attempt.id, start.body.attempt.id, 'reanuda el intento abierto');

  const q = Object.fromEntries(start.body.exam.questions.map(x => [x.q, x.id]));
  const sub = await ana('POST', `/api/attempts/${start.body.attempt.id}/submit`, { answers: { [q['¿2+2?']]: 1, [q['¿Error humano?']]: 2 } });
  assert.equal(sub.status, 200);
  assert.equal(sub.body.result.score, 1);
  assert.equal(sub.body.result.pct, 50);
  assert.equal(sub.body.result.passed, true);
  assert.equal(sub.body.result.review.length, 2);

  assert.equal((await ana('POST', `/api/attempts/${start.body.attempt.id}/submit`, { answers: {} })).status, 409);
  assert.equal((await ana('POST', `/api/exams/${examId}/start`, {})).status, 409, 'sin intentos restantes');
});

test('otro alumno no puede ver el intento ajeno', async () => {
  const res = await prof('GET', `/api/exams/${examId}/results`);
  const attemptId = res.body.rows[0].attemptId;
  assert.equal((await beto('GET', `/api/attempts/${attemptId}`)).status, 404);
  assert.equal((await prof('GET', `/api/attempts/${attemptId}`)).status, 200);
});

test('el profesor ve resultados, pendientes y dificultad por pregunta', async () => {
  const r = await prof('GET', `/api/exams/${examId}/results`);
  assert.equal(r.body.rows.length, 1);
  assert.equal(r.body.rows[0].user.name, 'Ana');
  assert.deepEqual(r.body.pending.map(p => p.name), ['Beto']);
  assert.equal(r.body.questions.length, 2);
});

test('un intento vencido se cierra solo y entregar tarde queda marcado', async () => {
  const start = await beto('POST', `/api/exams/${examId}/start`, {});
  clock += 12 * 60000; // 12 minutos > 10 de límite + 1 de gracia
  const sub = await beto('POST', `/api/attempts/${start.body.attempt.id}/submit`, { answers: {} });
  assert.equal(sub.status, 200);
  assert.equal(sub.body.result.late, true);
});

test('biblioteca: lectura para todos, edición solo profesor y URLs seguras', async () => {
  const docs = await ana('GET', '/api/docs');
  assert.ok(docs.body.docs.length > 10);
  assert.equal((await ana('POST', '/api/docs', { title: 'x', url: 'https://a.com' })).status, 403);
  assert.equal((await prof('POST', '/api/docs', { title: 'x', url: 'javascript:alert(1)' })).status, 400);
  const r = await prof('POST', '/api/docs', { title: 'Apunte', url: 'https://ejemplo.com/apunte.pdf', category: 'Material del curso' });
  assert.equal(r.status, 201);
  assert.equal((await prof('DELETE', `/api/docs/${r.body.doc.id}`)).status, 200);
});

test('gestión de usuarios por el profesor', async () => {
  const users = await prof('GET', '/api/users');
  const ana = users.body.users.find(u => u.name === 'Ana');
  assert.equal(ana.xp, 120);
  assert.equal(ana.examsTaken, 1);
  const me = users.body.users.find(u => u.role === 'profesor');
  assert.equal((await prof('PUT', `/api/users/${me.id}/role`, { role: 'alumno' })).status, 400, 'no puede quedar sin profesores');
  const reset = await prof('PUT', `/api/users/${ana.id}/password`, { password: 'nuevaclave1' });
  assert.equal(reset.status, 200);
  const c = client();
  assert.equal((await c('POST', '/api/auth/login', { email: 'ana@escuela.edu', password: 'nuevaclave1' })).status, 200);
});

test('archivos estáticos sin path traversal', async () => {
  const ok = await fetch(base + '/');
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('content-security-policy'), /default-src 'self'/);
  const bad = await fetch(base + '/..%2fpackage.json');
  assert.notEqual(bad.status, 200);
});

test('el progreso guarda temas, repaso y simulacros saneados', async () => {
  const r = await beto('PUT', '/api/progress', {
    xp: 10, results: {}, badges: [],
    topics: { '4.2': { seen: 10, correct: 4 }, 'x.y': { seen: 1, correct: 1 }, '1.3': { seen: 2, correct: 9 } },
    review: [
      { key: 'qabc', q: '¿Pregunta?', options: ['A', 'B'], answer: 'B', explain: '', sec: '4.2', box: 9, due: 123 },
      { key: 'mal', q: 'x', options: ['A', 'B'], answer: 'C' },
    ],
    mocks: [{ date: '2026-10-01T10:00:00Z', score: 30, max: 40, passed: true, minutes: 60, byCh: { 1: [6, 8] } }],
    daily: { date: '2026-10-01', count: 12 }, streak: { count: 3, last: '2026-10-01' }, mastered: 2,
  });
  assert.equal(r.status, 200);
  const me = await beto('GET', '/api/me');
  const p = me.body.progress;
  assert.deepEqual(Object.keys(p.topics).sort(), ['1.3', '4.2']);
  assert.equal(p.topics['1.3'].correct, 2, 'correctas no puede superar vistas');
  assert.equal(p.review.length, 1, 'se descarta la respuesta que no está entre las opciones');
  assert.equal(p.review[0].box, 5);
  assert.equal(p.mocks[0].pct, 75);
  assert.equal(p.streak.count, 3);
});

test('reportes de preguntas: el alumno reporta y el profesor resuelve', async () => {
  assert.equal((await beto('POST', '/api/reports', { text: 'Pregunta X', reason: 'inventado' })).status, 400);
  const r = await beto('POST', '/api/reports', { source: 'simulacro', key: 'qabc', text: '¿Qué es un defecto?', reason: 'respuesta-incorrecta', comment: 'La B también es correcta' });
  assert.equal(r.status, 201);
  assert.equal((await beto('GET', '/api/reports')).status, 403);
  const list = await prof('GET', '/api/reports');
  assert.equal(list.body.open, 1);
  assert.equal(list.body.reports[0].user.name, 'Beto');
  assert.equal((await prof('PUT', `/api/reports/${list.body.reports[0].id}`, { status: 'resuelto' })).status, 200);
  assert.equal((await prof('GET', '/api/reports')).body.open, 0);
});

test('el profesor ve los temas del curso agregados', async () => {
  const r = await prof('GET', '/api/class/topics');
  assert.equal(r.status, 200);
  assert.equal(r.body.topics['4.2'].seen, 10);
  assert.equal(r.body.mockTakers, 1);
  assert.equal(r.body.mockPassing, 1);
  assert.equal((await beto('GET', '/api/class/topics')).status, 403);
});
