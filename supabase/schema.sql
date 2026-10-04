-- QA Academy · esquema para Supabase (Postgres)
-- Ejecútalo una vez en el SQL Editor de tu proyecto de Supabase.
-- Cada colección de la aplicación es una tabla con un documento JSON por fila.
-- RLS queda activado y SIN políticas: solo el servidor (con la clave service_role) puede leer y escribir.

do $$
declare t text;
begin
  foreach t in array array['qa_users', 'qa_sessions', 'qa_progress', 'qa_exams', 'qa_attempts', 'qa_docs', 'qa_reports', 'qa_meta']
  loop
    execute format('create table if not exists public.%I (
      id text primary key,
      data jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create index if not exists %I on public.%I (created_at, id)', t || '_created_idx', t);
  end loop;
end $$;

-- Búsquedas frecuentes
create index if not exists qa_sessions_user_idx on public.qa_sessions ((data->>'userId'));
create index if not exists qa_attempts_exam_idx on public.qa_attempts ((data->>'examId'));
create index if not exists qa_users_email_idx on public.qa_users ((data->>'email'));
