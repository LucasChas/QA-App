# Publicar QA Academy con Supabase y Vercel

Al terminar tendrás una URL pública (por ejemplo `https://qa-academy.vercel.app`) para compartir. Los datos (cuentas, progreso, exámenes, notas, reportes) quedan guardados en tu proyecto de Supabase.

Tiempo estimado: 10 minutos. Los planes gratuitos de Supabase y Vercel alcanzan para un equipo o un curso.

## 1. Crear la base de datos en Supabase

1. Entra a <https://supabase.com/dashboard> y crea un proyecto (**New project**). Elige una región cercana y guarda la contraseña de la base en un lugar seguro.
2. Cuando el proyecto esté listo, abre **SQL Editor → New query**.
3. Pega el contenido de [`supabase/schema.sql`](../supabase/schema.sql) y pulsa **Run**. Se crean las tablas `qa_users`, `qa_sessions`, `qa_progress`, `qa_exams`, `qa_attempts`, `qa_docs`, `qa_reports` y `qa_meta`.
4. Ve a **Project Settings → API** y copia dos valores:
   - **Project URL**, por ejemplo `https://abcd1234.supabase.co`.
   - La clave **service_role** (sección *Project API keys*; pulsa *Reveal*). Es una clave secreta: solo va en las variables de entorno de Vercel, nunca en el código ni en un chat.

> Las tablas tienen RLS activado y sin políticas: la clave pública (*anon*) no puede leerlas. Solo el servidor, con la clave `service_role`, accede a los datos.

## 2. Publicar en Vercel

1. Entra a <https://vercel.com/new> e inicia sesión con tu cuenta de GitHub.
2. Importa el repositorio **LucasChas/QA-App**. Si no aparece, pulsa *Adjust GitHub App Permissions* y dale acceso.
3. En la configuración del proyecto:
   - **Framework Preset**: *Other*. El resto lo toma de `vercel.json`, no hace falta cambiar nada.
   - **Environment Variables**: agrega
     - `SUPABASE_URL`: la Project URL del paso 1.
     - `SUPABASE_SERVICE_ROLE_KEY`: la clave service_role del paso 1.
     - `TEACHER_CODE` (opcional): un código para que otras personas se registren como profesores.
4. Pulsa **Deploy**. En uno o dos minutos Vercel te da la URL.
5. Rama: Vercel publica en producción la rama por defecto del repositorio. Hoy el trabajo está en `claude/admiring-newton-jahnux`. Puedes fusionarla en `main`, o cambiar la rama de producción en **Settings → Git → Production Branch**.

## 3. Primer uso

1. Abre la URL y **crea tu cuenta primero**: la primera cuenta registrada es la del profesor administrador.
2. Pasa la URL a tu compañero. Si debe ser profesor, puedes:
   - cambiarle el rol desde **Profesor → Alumnos** después de que se registre, o
   - darle el `TEACHER_CODE` para que lo use al registrarse.
3. Para comprobar que los datos se guardan: en Supabase, **Table Editor → qa_users** muestra las cuentas creadas.

## Alternativa: desplegar desde la terminal

```bash
npm i -g vercel
vercel login
vercel link                                   # crea o vincula el proyecto
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

## Pasar datos que ya tienes en local

Si usaste la app en tu computadora y quieres conservar esas cuentas y notas:

1. Crea `.env.local` a partir de [`.env.example`](../.env.example) con tus valores de Supabase.
2. Ejecuta `npm install` y luego `npm run migrate:supabase`. Copia `data/db.json` a Supabase y puedes repetirlo sin crear duplicados.

## Ejecutar en local contra Supabase

```bash
npm install
npm run start:supabase    # usa las variables de .env.local
```

Sin esas variables, `npm start` sigue usando el archivo local `data/db.json`.

## Cómo funciona

- `public/` se publica como sitio estático.
- `api/index.js` es una función serverless que atiende `/api/*` con el mismo servidor de `server/app.js`.
- Cada solicitud carga desde Supabase solo lo que necesita y guarda únicamente los registros que cambiaron, antes de responder.
- Límite conocido: el control de intentos de inicio de sesión vive en la memoria de cada instancia serverless, así que en Vercel es menos estricto que en un servidor único.
