'use strict';
/* Backend de datos en Supabase (Postgres).
   Cada colección es una tabla qa_<colección> con columnas (id text, data jsonb, created_at, updated_at);
   el esquema está en supabase/schema.sql. Se usa la clave service_role SOLO en el servidor:
   las tablas tienen RLS activado y sin políticas, así que la clave pública no puede leerlas. */
const crypto = require('node:crypto');
const { UnitOfWork, ARRAYS } = require('./store');
const { seedDocs, seedExam } = require('./seed');

const PAGE = 1000;
const table = c => `qa_${c}`;

function check({ error }, what) {
  if (error) {
    const e = new Error(`Supabase (${what}): ${error.message}`);
    e.code = error.code;
    throw e;
  }
}

function supabaseBackend(client) {
  return {
    async all(c) {
      const rows = [];
      for (let from = 0; ; from += PAGE) {
        const r = await client.from(table(c)).select('id,data')
          .order('created_at', { ascending: true }).order('id', { ascending: true })
          .range(from, from + PAGE - 1);
        check(r, `leer ${c}`);
        rows.push(...r.data);
        if (r.data.length < PAGE) break;
      }
      return rows;
    },
    async byIds(c, ids) {
      const r = await client.from(table(c)).select('id,data').in('id', ids);
      check(r, `leer ${c}`);
      return r.data;
    },
    async where(c, field, value) {
      const r = await client.from(table(c)).select('id,data').eq(`data->>${field}`, value);
      check(r, `buscar en ${c}`);
      return r.data;
    },
    async write(c, upserts, deletes) {
      if (upserts.length) {
        const now = new Date().toISOString();
        check(await client.from(table(c)).upsert(upserts.map(u => ({ id: u.id, data: u.data, updated_at: now }))), `guardar ${c}`);
      }
      if (deletes.length) {
        check(await client.from(table(c)).delete().in('id', deletes), `borrar ${c}`);
      }
    },
  };
}

/* Carga la biblioteca y el examen de ejemplo la primera vez que se usa una base vacía.
   La fila qa_meta 'seed' hace de candado: solo la instancia que logra insertarla siembra los datos. */
async function ensureSeeded(client, backend) {
  const r = await client.from('qa_meta').insert({ id: 'seed', data: { at: new Date().toISOString() } });
  if (r.error) {
    if (r.error.code === '23505') return; // ya estaba sembrada
    check(r, 'sembrar datos iniciales');
  }
  await backend.write('docs', seedDocs().map(d => ({ id: d.id, data: d })), []);
  const exam = seedExam();
  await backend.write('exams', [{ id: exam.id, data: exam }], []);
}

/**
 * opts.url / opts.key: proyecto de Supabase (clave service_role).
 * opts.client: cliente ya creado (las pruebas usan uno simulado).
 */
function createSupabaseStore(opts) {
  let client = opts.client;
  if (!client) {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(opts.url, opts.key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  const backend = supabaseBackend(client);
  let seeded = null;
  return {
    kind: 'supabase',
    async begin() {
      if (!seeded) seeded = ensureSeeded(client, backend).catch(e => { seeded = null; throw e; });
      await seeded;
      return new UnitOfWork(backend);
    },
    id: () => crypto.randomUUID(),
    backend,
  };
}

module.exports = { createSupabaseStore, supabaseBackend, ARRAYS };
