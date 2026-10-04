'use strict';
/* Copia los datos de un archivo local (data/db.json) a Supabase.
   Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.js [ruta/db.json]
   Es idempotente: vuelve a escribir los mismos ids sin duplicar. */
const fs = require('node:fs');
const path = require('node:path');
const { createSupabaseStore } = require('../server/supabase-store');
const { ARRAYS, KEYED } = require('../server/store');

async function main() {
  const file = process.argv[2] || path.join(__dirname, '..', 'data', 'db.json');
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  if (!fs.existsSync(file)) throw new Error(`No existe ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const store = createSupabaseStore({ url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY });
  await store.begin(); // crea la marca de siembra para no duplicar la biblioteca inicial
  for (const c of ARRAYS) {
    const rows = (data[c] || []).map(x => ({ id: x.id, data: x }));
    for (let i = 0; i < rows.length; i += 500) await store.backend.write(c, rows.slice(i, i + 500), []);
    console.log(`${c}: ${rows.length}`);
  }
  for (const c of KEYED) {
    const rows = Object.entries(data[c] || {}).map(([id, v]) => ({ id, data: v }));
    for (let i = 0; i < rows.length; i += 500) await store.backend.write(c, rows.slice(i, i + 500), []);
    console.log(`${c}: ${rows.length}`);
  }
  console.log('Migración terminada.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
