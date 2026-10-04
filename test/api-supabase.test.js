'use strict';
/* La misma batería de pruebas con el backend de Supabase sobre un cliente simulado. */
const { test } = require('node:test');
const assert = require('node:assert');
const { createSupabaseStore } = require('../server/supabase-store');
const { createFakeSupabase } = require('./fake-supabase');
const { runSuite } = require('./suite');

const fake = createFakeSupabase();
runSuite(() => createSupabaseStore({ client: fake }));

test('supabase: siembra una sola vez y persiste en tablas', async () => {
  const docs = fake.tables.get('qa_docs');
  assert.ok(docs.size > 10, 'biblioteca sembrada');
  assert.ok(fake.tables.get('qa_meta').has('seed'));
  // una segunda instancia sobre la misma base no vuelve a sembrar
  const store2 = createSupabaseStore({ client: fake });
  const before = docs.size;
  await store2.begin();
  assert.equal(docs.size, before);
  assert.ok(fake.tables.get('qa_users').size >= 3);
  assert.ok(fake.tables.get('qa_sessions').size >= 1);
});
