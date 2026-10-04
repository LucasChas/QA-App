'use strict';
/* API REST de QA Academy + servidor de archivos estáticos. Sin dependencias externas. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const auth = require('./auth');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_BODY = 1024 * 1024;
const SUBMIT_GRACE_MS = 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

/* ---------- Validación ---------- */
const str = (v, field, { min = 0, max = 500 } = {}) => {
  if (typeof v !== 'string') fail(400, `El campo "${field}" es obligatorio.`);
  const s = v.trim();
  if (s.length < min) fail(400, min === 1 ? `El campo "${field}" es obligatorio.` : `El campo "${field}" debe tener al menos ${min} caracteres.`);
  if (s.length > max) fail(400, `El campo "${field}" admite como máximo ${max} caracteres.`);
  return s;
};
const int = (v, field, min, max) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) fail(400, `El campo "${field}" debe ser un número entre ${min} y ${max}.`);
  return n;
};
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });

function sanitizeProgress(p) {
  if (!p || typeof p !== 'object') fail(400, 'Progreso inválido.');
  const results = {};
  if (p.results && typeof p.results === 'object') {
    for (const [k, r] of Object.entries(p.results).slice(0, 100)) {
      if (!/^[\w-]{1,60}$/.test(k) || !r || typeof r !== 'object') continue;
      const clamp = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));
      results[k] = { best: clamp(r.best, 100), plays: clamp(r.plays, 1e6), stars: clamp(r.stars, 3), last: clamp(r.last, 100) };
    }
  }
  const badges = Array.isArray(p.badges) ? p.badges.filter(b => typeof b === 'string' && /^[\w-]{1,60}$/.test(b)).slice(0, 50) : [];
  return { xp: int(p.xp ?? 0, 'xp', 0, 1e7), results, badges, updatedAt: new Date().toISOString() };
}

function sanitizeExam(body, store, existing) {
  const students = new Set(store.data.users.filter(u => u.role === 'alumno').map(u => u.id));
  let assignedTo = 'all';
  if (Array.isArray(body.assignedTo)) {
    assignedTo = body.assignedTo.filter(id => students.has(id));
    if (!assignedTo.length) fail(400, 'Selecciona al menos un alumno o asigna el examen a todos.');
  }
  let dueDate = null;
  if (body.dueDate) {
    const d = new Date(body.dueDate);
    if (Number.isNaN(d.getTime())) fail(400, 'La fecha límite no es válida.');
    dueDate = d.toISOString();
  }
  if (!Array.isArray(body.questions) || body.questions.length < 1) fail(400, 'El examen necesita al menos una pregunta.');
  if (body.questions.length > 100) fail(400, 'El examen admite como máximo 100 preguntas.');
  const oldIds = new Set(existing ? existing.questions.map(q => q.id) : []);
  const questions = body.questions.map((q, i) => {
    const n = i + 1;
    if (!q || typeof q !== 'object') fail(400, `La pregunta ${n} no es válida.`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) fail(400, `La pregunta ${n} debe tener entre 2 y 6 opciones.`);
    const options = q.options.map((o, k) => str(o, `pregunta ${n}, opción ${k + 1}`, { min: 1, max: 500 }));
    return {
      id: typeof q.id === 'string' && oldIds.has(q.id) ? q.id : crypto.randomUUID(),
      q: str(q.q, `pregunta ${n}`, { min: 1, max: 2000 }),
      options,
      answer: int(q.answer, `respuesta correcta de la pregunta ${n}`, 0, options.length - 1),
      explain: typeof q.explain === 'string' ? q.explain.trim().slice(0, 2000) : '',
    };
  });
  return {
    title: str(body.title, 'título', { min: 1, max: 200 }),
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '',
    timeLimit: int(body.timeLimit ?? 0, 'tiempo límite (minutos)', 0, 300),
    passPct: int(body.passPct ?? 65, 'porcentaje de aprobación', 1, 100),
    attemptsAllowed: int(body.attemptsAllowed ?? 1, 'intentos permitidos', 1, 20),
    showAnswers: Boolean(body.showAnswers),
    published: Boolean(body.published),
    assignedTo,
    dueDate,
    questions,
  };
}

/* ---------- Utilidades HTTP ---------- */
function send(res, status, body, headers = {}) {
  const json = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(json);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!/application\/json/.test(req.headers['content-type'] || '')) {
      return reject(new HttpError(415, 'Se esperaba un cuerpo JSON.'));
    }
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new HttpError(413, 'La solicitud es demasiado grande.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (e) { reject(new HttpError(400, 'El cuerpo JSON no es válido.')); }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  if (urlPath.endsWith('/')) file = path.join(file, 'index.html');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- Lógica de exámenes ---------- */
const isAssigned = (exam, user) => exam.assignedTo === 'all' || exam.assignedTo.includes(user.id);
const deadlineOf = (exam, startedAt) => exam.timeLimit ? new Date(new Date(startedAt).getTime() + exam.timeLimit * 60000).toISOString() : null;

function grade(exam, answers) {
  let score = 0;
  const graded = {};
  for (const q of exam.questions) {
    const chosen = Number.isInteger(answers[q.id]) ? answers[q.id] : null;
    graded[q.id] = chosen;
    if (chosen === q.answer) score++;
  }
  const max = exam.questions.length;
  const pct = max ? Math.round((score / max) * 100) : 0;
  return { answers: graded, score, max, pct, passed: pct >= exam.passPct };
}

function finalize(store, attempt, exam, answers, now) {
  const deadline = attempt.deadline ? new Date(attempt.deadline).getTime() : null;
  Object.assign(attempt, grade(exam, answers || {}), {
    submittedAt: new Date(now).toISOString(),
    late: deadline !== null && now > deadline + SUBMIT_GRACE_MS,
  });
  store.save();
}

/* Cierra intentos abiertos cuyo tiempo ya venció (se califican sin respuestas). */
function closeExpired(store, exam, userId, now) {
  for (const a of store.data.attempts) {
    if (a.examId === exam.id && a.userId === userId && !a.submittedAt && a.deadline &&
      now > new Date(a.deadline).getTime() + SUBMIT_GRACE_MS) {
      finalize(store, a, exam, {}, now);
      a.late = false;
      a.expired = true;
    }
  }
}

function studentExamView(store, exam, user, now) {
  closeExpired(store, exam, user.id, now);
  const attempts = store.data.attempts.filter(a => a.examId === exam.id && a.userId === user.id);
  const done = attempts.filter(a => a.submittedAt);
  const open = attempts.find(a => !a.submittedAt);
  const pastDue = exam.dueDate && now > new Date(exam.dueDate).getTime();
  let status = 'disponible';
  if (open) status = 'en-curso';
  else if (done.length >= exam.attemptsAllowed) status = 'completado';
  else if (pastDue) status = 'vencido';
  return {
    id: exam.id, title: exam.title, description: exam.description, timeLimit: exam.timeLimit,
    passPct: exam.passPct, attemptsAllowed: exam.attemptsAllowed, dueDate: exam.dueDate,
    questionCount: exam.questions.length, status,
    attempts: done.map(a => ({ id: a.id, pct: a.pct, score: a.score, max: a.max, passed: a.passed, submittedAt: a.submittedAt })),
  };
}

function attemptResult(attempt, exam, withReview) {
  const out = {
    id: attempt.id, examId: exam.id, examTitle: exam.title, score: attempt.score, max: attempt.max,
    pct: attempt.pct, passed: attempt.passed, passPct: exam.passPct, submittedAt: attempt.submittedAt,
    late: Boolean(attempt.late), expired: Boolean(attempt.expired),
  };
  if (withReview) {
    out.review = exam.questions.map(q => ({
      q: q.q, options: q.options, answer: q.answer, explain: q.explain,
      chosen: attempt.answers ? attempt.answers[q.id] ?? null : null,
    }));
  }
  return out;
}

/* ---------- Aplicación ---------- */
function createApp(store, opts = {}) {
  const secureCookies = Boolean(opts.secureCookies);
  const teacherCode = opts.teacherCode || null;
  const now = opts.now || (() => Date.now());
  const loginAttempts = new Map();

  function rateLimit(key) {
    const t = now();
    const entry = loginAttempts.get(key);
    if (!entry || entry.reset < t) { loginAttempts.set(key, { count: 1, reset: t + 15 * 60000 }); return; }
    entry.count++;
    if (entry.count > 10) fail(429, 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.');
  }

  const routes = [];
  const route = (method, pattern, role, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([\\w-]+)'; }) + '$');
    routes.push({ method, re, keys, role, handler });
  };

  const db = () => store.data;
  const findExam = id => db().exams.find(e => e.id === id) || fail(404, 'El examen no existe.');

  /* --- Estado público: indica si todavía no hay cuentas (la primera será de profesor) --- */
  route('GET', '/api/status', null, async ({ res }) => send(res, 200, { setup: db().users.length === 0, teacherCode: Boolean(teacherCode) }));

  /* --- Autenticación --- */
  route('POST', '/api/auth/register', null, async ({ body, res, req }) => {
    rateLimit(`reg:${req.socket.remoteAddress}`);
    const name = str(body.name, 'nombre', { min: 2, max: 80 });
    const email = str(body.email, 'email', { min: 3, max: 120 }).toLowerCase();
    if (!EMAIL_RE.test(email)) fail(400, 'Escribe un email válido, por ejemplo ana@empresa.com.');
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < 8) fail(400, 'La contraseña debe tener al menos 8 caracteres.');
    if (password.length > 200) fail(400, 'La contraseña es demasiado larga.');
    if (db().users.some(u => u.email === email)) fail(409, 'Ya existe una cuenta con ese email. Inicia sesión.');
    const first = db().users.length === 0;
    const isTeacher = first || (teacherCode && body.teacherCode === teacherCode);
    if (body.teacherCode && !isTeacher) fail(400, 'El código de profesor no es correcto.');
    const user = {
      id: store.id(), name, email, role: isTeacher ? 'profesor' : 'alumno',
      password: auth.hashPassword(password), createdAt: new Date(now()).toISOString(),
    };
    db().users.push(user);
    store.save();
    const token = auth.createSession(store, user.id);
    send(res, 201, { user: publicUser(user), progress: null }, { 'Set-Cookie': auth.sessionCookie(token, secureCookies) });
  });

  route('POST', '/api/auth/login', null, async ({ body, res, req }) => {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    rateLimit(`login:${req.socket.remoteAddress}:${email}`);
    const user = db().users.find(u => u.email === email);
    if (!user || !auth.verifyPassword(String(body.password || ''), user.password)) {
      fail(401, 'El email o la contraseña no son correctos.');
    }
    const token = auth.createSession(store, user.id);
    send(res, 200, { user: publicUser(user), progress: db().progress[user.id] || null },
      { 'Set-Cookie': auth.sessionCookie(token, secureCookies) });
  });

  route('POST', '/api/auth/logout', null, async ({ req, res }) => {
    auth.destroySession(store, req);
    send(res, 200, { ok: true }, { 'Set-Cookie': auth.clearCookie() });
  });

  route('GET', '/api/me', 'any', async ({ user, res }) => {
    send(res, 200, { user: publicUser(user), progress: db().progress[user.id] || null });
  });

  route('PUT', '/api/me/password', 'any', async ({ user, body, res }) => {
    if (!auth.verifyPassword(String(body.current || ''), user.password)) fail(400, 'La contraseña actual no es correcta.');
    const next = typeof body.next === 'string' ? body.next : '';
    if (next.length < 8) fail(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    user.password = auth.hashPassword(next);
    store.save();
    send(res, 200, { ok: true });
  });

  route('PUT', '/api/progress', 'any', async ({ user, body, res }) => {
    db().progress[user.id] = sanitizeProgress(body);
    store.save();
    send(res, 200, { ok: true });
  });

  /* --- Biblioteca --- */
  route('GET', '/api/docs', 'any', async ({ res }) => send(res, 200, { docs: db().docs }));

  route('POST', '/api/docs', 'profesor', async ({ user, body, res }) => {
    const url = str(body.url, 'enlace', { min: 8, max: 500 });
    let parsed;
    try { parsed = new URL(url); } catch (e) { fail(400, 'El enlace no es una URL válida.'); }
    if (!/^https?:$/.test(parsed.protocol)) fail(400, 'El enlace debe empezar con http:// o https://.');
    const doc = {
      id: store.id(),
      title: str(body.title, 'título', { min: 1, max: 200 }),
      url: parsed.href,
      category: str(body.category || 'Material del curso', 'categoría', { min: 1, max: 80 }),
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '',
      lang: body.lang === 'en' ? 'en' : 'es',
      addedBy: user.id,
      createdAt: new Date(now()).toISOString(),
    };
    db().docs.push(doc);
    store.save();
    send(res, 201, { doc });
  });

  route('DELETE', '/api/docs/:id', 'profesor', async ({ params, res }) => {
    const i = db().docs.findIndex(d => d.id === params.id);
    if (i < 0) fail(404, 'El documento no existe.');
    db().docs.splice(i, 1);
    store.save();
    send(res, 200, { ok: true });
  });

  /* --- Exámenes --- */
  route('GET', '/api/exams', 'any', async ({ user, res }) => {
    const t = now();
    if (user.role === 'profesor') {
      const students = db().users.filter(u => u.role === 'alumno');
      const exams = db().exams.map(e => {
        const done = db().attempts.filter(a => a.examId === e.id && a.submittedAt);
        const assigned = e.assignedTo === 'all' ? students.length : e.assignedTo.length;
        const takers = new Set(done.map(a => a.userId)).size;
        const avg = done.length ? Math.round(done.reduce((s, a) => s + a.pct, 0) / done.length) : null;
        return {
          id: e.id, title: e.title, description: e.description, published: e.published, dueDate: e.dueDate,
          timeLimit: e.timeLimit, passPct: e.passPct, questionCount: e.questions.length, createdAt: e.createdAt,
          assignedCount: assigned, takers, avg, passed: done.filter(a => a.passed).length, attemptsCount: done.length,
        };
      });
      return send(res, 200, { exams });
    }
    const exams = db().exams.filter(e => e.published && isAssigned(e, user)).map(e => studentExamView(store, e, user, t));
    send(res, 200, { exams });
  });

  route('GET', '/api/exams/:id', 'profesor', async ({ params, res }) => send(res, 200, { exam: findExam(params.id) }));

  route('POST', '/api/exams', 'profesor', async ({ user, body, res }) => {
    const exam = { id: store.id(), ...sanitizeExam(body, store, null), createdBy: user.id, createdAt: new Date(now()).toISOString() };
    db().exams.push(exam);
    store.save();
    send(res, 201, { exam });
  });

  route('PUT', '/api/exams/:id', 'profesor', async ({ params, body, res }) => {
    const exam = findExam(params.id);
    Object.assign(exam, sanitizeExam(body, store, exam), { updatedAt: new Date(now()).toISOString() });
    store.save();
    send(res, 200, { exam });
  });

  route('DELETE', '/api/exams/:id', 'profesor', async ({ params, res }) => {
    findExam(params.id);
    db().exams = db().exams.filter(e => e.id !== params.id);
    db().attempts = db().attempts.filter(a => a.examId !== params.id);
    store.save();
    send(res, 200, { ok: true });
  });

  route('GET', '/api/exams/:id/results', 'profesor', async ({ params, res }) => {
    const exam = findExam(params.id);
    const users = new Map(db().users.map(u => [u.id, u]));
    const rows = db().attempts.filter(a => a.examId === exam.id && a.submittedAt).map(a => {
      const u = users.get(a.userId);
      return {
        attemptId: a.id, user: u ? { id: u.id, name: u.name, email: u.email } : { id: a.userId, name: '(cuenta eliminada)', email: '' },
        score: a.score, max: a.max, pct: a.pct, passed: a.passed, startedAt: a.startedAt, submittedAt: a.submittedAt,
        late: Boolean(a.late), expired: Boolean(a.expired),
      };
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const students = db().users.filter(u => u.role === 'alumno' && isAssigned(exam, u));
    const took = new Set(rows.map(r => r.user.id));
    const pending = students.filter(u => !took.has(u.id)).map(u => ({ id: u.id, name: u.name, email: u.email }));
    // Dificultad por pregunta: porcentaje de aciertos
    const done = db().attempts.filter(a => a.examId === exam.id && a.submittedAt);
    const questions = exam.questions.map(q => {
      const answered = done.filter(a => a.answers && q.id in a.answers);
      const right = answered.filter(a => a.answers[q.id] === q.answer).length;
      return { id: q.id, q: q.q, correctPct: answered.length ? Math.round((right / answered.length) * 100) : null };
    });
    send(res, 200, { exam: { id: exam.id, title: exam.title, passPct: exam.passPct, questionCount: exam.questions.length }, rows, pending, questions });
  });

  route('POST', '/api/exams/:id/start', 'alumno', async ({ user, params, res }) => {
    const exam = findExam(params.id);
    if (!exam.published || !isAssigned(exam, user)) fail(404, 'El examen no existe.');
    const t = now();
    closeExpired(store, exam, user.id, t);
    let attempt = db().attempts.find(a => a.examId === exam.id && a.userId === user.id && !a.submittedAt);
    if (!attempt) {
      const done = db().attempts.filter(a => a.examId === exam.id && a.userId === user.id && a.submittedAt).length;
      if (done >= exam.attemptsAllowed) fail(409, 'Ya usaste todos los intentos de este examen.');
      if (exam.dueDate && t > new Date(exam.dueDate).getTime()) fail(409, 'La fecha límite de este examen ya pasó.');
      const startedAt = new Date(t).toISOString();
      const order = exam.questions.map(q => q.id);
      for (let i = order.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [order[i], order[j]] = [order[j], order[i]];
      }
      attempt = { id: store.id(), examId: exam.id, userId: user.id, startedAt, deadline: deadlineOf(exam, startedAt), order, submittedAt: null };
      db().attempts.push(attempt);
      store.save();
    }
    const byId = new Map(exam.questions.map(q => [q.id, q]));
    const ids = (attempt.order || []).filter(id => byId.has(id));
    exam.questions.forEach(q => { if (!ids.includes(q.id)) ids.push(q.id); });
    send(res, 200, {
      attempt: { id: attempt.id, startedAt: attempt.startedAt, deadline: attempt.deadline, serverNow: new Date(t).toISOString() },
      exam: {
        id: exam.id, title: exam.title, description: exam.description, timeLimit: exam.timeLimit, passPct: exam.passPct,
        questions: ids.map(id => ({ id, q: byId.get(id).q, options: byId.get(id).options })),
      },
    });
  });

  route('POST', '/api/attempts/:id/submit', 'alumno', async ({ user, params, body, res }) => {
    const attempt = db().attempts.find(a => a.id === params.id && a.userId === user.id) || fail(404, 'El intento no existe.');
    if (attempt.submittedAt) fail(409, 'Este intento ya fue entregado.');
    const exam = findExam(attempt.examId);
    const answers = {};
    if (body.answers && typeof body.answers === 'object') {
      for (const q of exam.questions) {
        const v = body.answers[q.id];
        if (Number.isInteger(v) && v >= 0 && v < q.options.length) answers[q.id] = v;
      }
    }
    finalize(store, attempt, exam, answers, now());
    send(res, 200, { result: attemptResult(attempt, exam, exam.showAnswers) });
  });

  route('GET', '/api/attempts/:id', 'any', async ({ user, params, res }) => {
    const attempt = db().attempts.find(a => a.id === params.id) || fail(404, 'El intento no existe.');
    const teacher = user.role === 'profesor';
    if (!teacher && attempt.userId !== user.id) fail(404, 'El intento no existe.');
    if (!attempt.submittedAt) fail(409, 'El intento todavía no fue entregado.');
    const exam = findExam(attempt.examId);
    const result = attemptResult(attempt, exam, teacher || exam.showAnswers);
    if (teacher) {
      const u = db().users.find(x => x.id === attempt.userId);
      result.user = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
    send(res, 200, { result });
  });

  /* --- Usuarios (profesor) --- */
  route('GET', '/api/users', 'profesor', async ({ res }) => {
    const users = db().users.map(u => {
      const p = db().progress[u.id];
      const done = db().attempts.filter(a => a.userId === u.id && a.submittedAt);
      return {
        ...publicUser(u),
        xp: p ? p.xp : 0,
        gamesPlayed: p ? Object.keys(p.results).length : 0,
        stars: p ? Object.values(p.results).reduce((s, r) => s + r.stars, 0) : 0,
        lastActivity: p ? p.updatedAt : null,
        examsTaken: done.length,
        examAvg: done.length ? Math.round(done.reduce((s, a) => s + a.pct, 0) / done.length) : null,
      };
    });
    send(res, 200, { users });
  });

  route('GET', '/api/users/:id', 'profesor', async ({ params, res }) => {
    const u = db().users.find(x => x.id === params.id) || fail(404, 'El usuario no existe.');
    const exams = new Map(db().exams.map(e => [e.id, e]));
    const attempts = db().attempts.filter(a => a.userId === u.id && a.submittedAt).map(a => ({
      id: a.id, examTitle: (exams.get(a.examId) || {}).title || '(examen eliminado)', pct: a.pct, passed: a.passed, submittedAt: a.submittedAt,
    }));
    send(res, 200, { user: publicUser(u), progress: db().progress[u.id] || null, attempts });
  });

  route('PUT', '/api/users/:id/role', 'profesor', async ({ user, params, body, res }) => {
    const target = db().users.find(x => x.id === params.id) || fail(404, 'El usuario no existe.');
    const role = body.role === 'profesor' ? 'profesor' : body.role === 'alumno' ? 'alumno' : fail(400, 'Rol inválido.');
    if (target.id === user.id && role === 'alumno' && db().users.filter(u => u.role === 'profesor').length === 1) {
      fail(400, 'Eres el único profesor: asigna otro profesor antes de cambiar tu rol.');
    }
    target.role = role;
    store.save();
    send(res, 200, { user: publicUser(target) });
  });

  route('PUT', '/api/users/:id/password', 'profesor', async ({ params, body, res }) => {
    const target = db().users.find(x => x.id === params.id) || fail(404, 'El usuario no existe.');
    const pw = typeof body.password === 'string' ? body.password : '';
    if (pw.length < 8) fail(400, 'La contraseña debe tener al menos 8 caracteres.');
    target.password = auth.hashPassword(pw);
    // Cierra las sesiones abiertas de ese usuario
    for (const [k, s] of Object.entries(db().sessions)) if (s.userId === target.id) delete db().sessions[k];
    store.save();
    send(res, 200, { ok: true });
  });

  /* --- Despachador --- */
  return async function handler(req, res) {
    const { pathname } = new URL(req.url, 'http://x');
    if (!pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      return serveStatic(req, res);
    }
    try {
      let matched = null;
      let pathMatched = false;
      for (const r of routes) {
        const m = pathname.match(r.re);
        if (!m) continue;
        pathMatched = true;
        if (r.method === req.method) { matched = { r, m }; break; }
      }
      if (!matched) fail(pathMatched ? 405 : 404, pathMatched ? 'Método no permitido.' : 'Ruta no encontrada.');
      const { r, m } = matched;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      let user = null;
      if (r.role) {
        user = auth.sessionUser(store, req);
        if (!user) fail(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
        if (r.role !== 'any' && user.role !== r.role) fail(403, 'No tienes permiso para esta acción.');
      }
      const body = ['POST', 'PUT'].includes(req.method) ? await readJson(req) : {};
      await r.handler({ req, res, params, body, user });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message });
      console.error(e);
      send(res, 500, { error: 'Error interno del servidor.' });
    }
  };
}

module.exports = { createApp };
