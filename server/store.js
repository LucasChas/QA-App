'use strict';
/* Capa de datos.
   Cada solicitud HTTP abre una "unidad de trabajo": carga solo las colecciones que necesita,
   los manejadores modifican los datos en memoria y al final commit() guarda únicamente los
   registros que cambiaron. Hay dos backends con la misma interfaz:
   - archivo JSON local (desarrollo y pruebas)
   - Supabase / Postgres (producción, ver server/supabase-store.js) */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { seedDocs, seedExam } = require('./seed');

/* Colecciones de registros con id (se cargan completas) */
const ARRAYS = ['users', 'exams', 'attempts', 'docs', 'reports'];
/* Colecciones clave → valor (se cargan por clave: una sesión, el progreso de un usuario) */
const KEYED = ['sessions', 'progress'];

class UnitOfWork {
  constructor(backend) {
    this.backend = backend;
    this.arrays = {};
    this.snap = {};
    this.data = {};
    for (const c of ARRAYS) {
      Object.defineProperty(this.data, c, {
        enumerable: true,
        get: () => {
          if (!(c in this.arrays)) throw new Error(`Colección no cargada: ${c}. Falta await need('${c}') en la ruta.`);
          return this.arrays[c];
        },
        set: v => {
          if (!(c in this.arrays)) throw new Error(`Colección no cargada: ${c}.`);
          this.arrays[c] = v;
        },
      });
    }
    for (const c of KEYED) { this.data[c] = {}; this.snap[c] = new Map(); }
  }

  /** Carga colecciones completas de registros (users, exams, …). */
  async load(...cols) {
    const todo = cols.flat().filter(c => ARRAYS.includes(c) && !(c in this.arrays));
    await Promise.all(todo.map(async c => {
      const rows = await this.backend.all(c);
      this.arrays[c] = rows.map(r => r.data);
      this.snap[c] = new Map(rows.map(r => [r.id, JSON.stringify(r.data)]));
    }));
  }

  #remember(c, rows) {
    for (const r of rows) {
      this.data[c][r.id] = r.data;
      this.snap[c].set(r.id, JSON.stringify(r.data));
    }
  }

  /** Carga claves concretas de una colección clave→valor. */
  async loadKeys(c, ids) {
    const todo = [...new Set(ids)].filter(id => id && !this.snap[c].has(id));
    if (todo.length) this.#remember(c, await this.backend.byIds(c, todo));
  }

  /** Carga todas las claves de una colección clave→valor. */
  async loadAllKeys(c) {
    this.#remember(c, (await this.backend.all(c)).filter(r => !this.snap[c].has(r.id)));
  }

  /** Carga las claves cuyo valor tiene field === value (p. ej. sesiones de un usuario). */
  async loadWhere(c, field, value) {
    this.#remember(c, (await this.backend.where(c, field, value)).filter(r => !this.snap[c].has(r.id)));
  }

  /** Guarda solo lo que cambió respecto de lo cargado. */
  async commit() {
    const writes = [];
    for (const c of ARRAYS) {
      if (!(c in this.arrays)) continue;
      const snap = this.snap[c];
      const seen = new Set();
      const upserts = [];
      for (const item of this.arrays[c]) {
        seen.add(item.id);
        if (snap.get(item.id) !== JSON.stringify(item)) upserts.push({ id: item.id, data: item });
      }
      const deletes = [...snap.keys()].filter(id => !seen.has(id));
      if (upserts.length || deletes.length) writes.push(this.backend.write(c, upserts, deletes));
    }
    for (const c of KEYED) {
      const snap = this.snap[c];
      const map = this.data[c];
      const upserts = Object.entries(map).filter(([k, v]) => snap.get(k) !== JSON.stringify(v)).map(([id, data]) => ({ id, data }));
      const deletes = [...snap.keys()].filter(k => !(k in map));
      if (upserts.length || deletes.length) writes.push(this.backend.write(c, upserts, deletes));
    }
    await Promise.all(writes);
  }
}

/* ---------- Backend: archivo JSON ---------- */
function fileBackend(file) {
  const EMPTY = () => ({ users: [], sessions: {}, progress: {}, exams: [], attempts: [], docs: [], reports: [] });
  let data;
  if (file && fs.existsSync(file)) {
    data = Object.assign(EMPTY(), JSON.parse(fs.readFileSync(file, 'utf8')));
  } else {
    data = EMPTY();
    data.docs = seedDocs();
    data.exams = [seedExam()];
  }
  const clone = v => structuredClone(v);

  let timer = null;
  function flush() {
    timer = null;
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }
  const schedule = () => { if (!timer) timer = setTimeout(flush, 50); };

  return {
    data,
    flush,
    cancel: () => { if (timer) clearTimeout(timer); timer = null; },
    async all(c) {
      return ARRAYS.includes(c)
        ? data[c].map(x => ({ id: x.id, data: clone(x) }))
        : Object.entries(data[c]).map(([id, v]) => ({ id, data: clone(v) }));
    },
    async byIds(c, ids) {
      return ids.filter(id => Object.hasOwn(data[c], id)).map(id => ({ id, data: clone(data[c][id]) }));
    },
    async where(c, field, value) {
      return Object.entries(data[c]).filter(([, v]) => v && v[field] === value).map(([id, v]) => ({ id, data: clone(v) }));
    },
    async write(c, upserts, deletes) {
      if (ARRAYS.includes(c)) {
        const del = new Set(deletes);
        data[c] = data[c].filter(x => !del.has(x.id));
        const index = new Map(data[c].map((x, i) => [x.id, i]));
        for (const u of upserts) {
          if (index.has(u.id)) data[c][index.get(u.id)] = clone(u.data);
          else data[c].push(clone(u.data));
        }
      } else {
        for (const k of deletes) delete data[c][k];
        for (const u of upserts) data[c][u.id] = clone(u.data);
      }
      schedule();
    },
  };
}

/** Almacén en archivo (file = null: solo en memoria, útil para pruebas). */
function createStore(file) {
  const backend = fileBackend(file);
  return {
    kind: 'archivo',
    begin: async () => new UnitOfWork(backend),
    flushNow() { backend.cancel(); backend.flush(); },
    id: () => crypto.randomUUID(),
    get raw() { return backend.data; },
  };
}

module.exports = { createStore, UnitOfWork, ARRAYS, KEYED };
