'use strict';
/* Contraseñas (scrypt) y sesiones con cookie HttpOnly. */
const crypto = require('node:crypto');

const SESSION_DAYS = 7;
const COOKIE = 'qa_session';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(password, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* En el almacén solo se guarda el hash del token, nunca el token en claro. */
const tokenKey = token => crypto.createHash('sha256').update(token).digest('hex');

/* Las funciones reciben la unidad de trabajo de la solicitud (uow); el guardado ocurre en uow.commit(). */
function createSession(uow, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  uow.data.sessions[tokenKey(token)] = {
    userId,
    expires: Date.now() + SESSION_DAYS * 864e5,
  };
  return token;
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

async function sessionUser(uow, req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  const key = tokenKey(token);
  await uow.loadKeys('sessions', [key]);
  const s = uow.data.sessions[key];
  if (!s) return null;
  if (s.expires < Date.now()) {
    delete uow.data.sessions[key];
    return null;
  }
  await uow.load('users');
  return uow.data.users.find(u => u.id === s.userId) || null;
}

async function destroySession(uow, req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return;
  const key = tokenKey(token);
  await uow.loadKeys('sessions', [key]);
  delete uow.data.sessions[key];
}

function sessionCookie(token, secure) {
  const attrs = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${SESSION_DAYS * 86400}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

module.exports = { hashPassword, verifyPassword, createSession, sessionUser, destroySession, sessionCookie, clearCookie };
