'use strict';
/* Almacenamiento en un archivo JSON con escritura atómica. Suficiente para un aula o un equipo. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { seedDocs, seedExam } = require('./seed');

const EMPTY = () => ({ users: [], sessions: {}, progress: {}, exams: [], attempts: [], docs: [], reports: [] });

function createStore(file) {
  let data;
  if (file && fs.existsSync(file)) {
    data = Object.assign(EMPTY(), JSON.parse(fs.readFileSync(file, 'utf8')));
  } else {
    data = EMPTY();
    data.docs = seedDocs();
    data.exams = [seedExam()];
  }

  let timer = null;
  function flush() {
    timer = null;
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }

  return {
    get data() { return data; },
    /** Programa un guardado; varias escrituras seguidas se agrupan en una. */
    save() { if (!timer) timer = setTimeout(flush, 50); },
    flushNow() { if (timer) clearTimeout(timer); flush(); },
    id: () => crypto.randomUUID(),
  };
}

module.exports = { createStore };
