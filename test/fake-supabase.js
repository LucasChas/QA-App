'use strict';
/* Cliente de Supabase simulado en memoria con el subconjunto de la API que usa
   server/supabase-store.js (select/order/range/in/eq/insert/upsert/delete). Imita el viaje
   por JSON (jsonb) y los errores de clave duplicada (23505) y de tabla inexistente. */
const TABLES = ['qa_users', 'qa_sessions', 'qa_progress', 'qa_exams', 'qa_attempts', 'qa_docs', 'qa_reports', 'qa_meta'];

function createFakeSupabase() {
  const tables = new Map(TABLES.map(t => [t, new Map()]));
  let seq = 0;
  let calls = 0;
  const clone = v => JSON.parse(JSON.stringify(v));
  const field = (row, col) => {
    const m = col.match(/^data->>(\w+)$/);
    if (m) { const v = row.data ? row.data[m[1]] : undefined; return v === undefined || v === null ? null : String(v); }
    return row[col];
  };

  function from(t) {
    const filters = [];
    const orders = [];
    let range = null;
    let mode = 'select';
    let payload = [];
    function exec() {
      calls++;
      const tb = tables.get(t);
      if (!tb) return { data: null, error: { code: '42P01', message: `relation "${t}" does not exist` } };
      if (mode === 'insert') {
        if (payload.some(r => tb.has(r.id))) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        payload.forEach(r => tb.set(r.id, { id: r.id, data: clone(r.data), created_at: ++seq }));
        return { data: null, error: null };
      }
      if (mode === 'upsert') {
        payload.forEach(r => { const ex = tb.get(r.id); tb.set(r.id, { id: r.id, data: clone(r.data), created_at: ex ? ex.created_at : ++seq }); });
        return { data: null, error: null };
      }
      let rows = [...tb.values()].filter(r => filters.every(f => f(r)));
      if (mode === 'delete') { rows.forEach(r => tb.delete(r.id)); return { data: null, error: null }; }
      rows.sort((a, b) => {
        for (const [col, asc] of orders) {
          const x = a[col]; const y = b[col];
          if (x < y) return asc ? -1 : 1;
          if (x > y) return asc ? 1 : -1;
        }
        return 0;
      });
      if (range) rows = rows.slice(range[0], range[1] + 1);
      return { data: rows.map(r => ({ id: r.id, data: clone(r.data) })), error: null };
    }
    const q = {
      select() { mode = 'select'; return q; },
      order(col, o = {}) { orders.push([col, o.ascending !== false]); return q; },
      range(a, b) { range = [a, b]; return q; },
      in(col, vals) { filters.push(r => vals.includes(field(r, col))); return q; },
      eq(col, v) { filters.push(r => field(r, col) === v); return q; },
      insert(rows) { mode = 'insert'; payload = [].concat(rows); return q; },
      upsert(rows) { mode = 'upsert'; payload = [].concat(rows); return q; },
      delete() { mode = 'delete'; return q; },
      then(resolve, reject) { return Promise.resolve().then(exec).then(resolve, reject); },
    };
    return q;
  }

  return { from, tables, get calls() { return calls; } };
}

module.exports = { createFakeSupabase };
