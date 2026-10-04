# QA Academy

Plataforma de capacitación en testing de software basada en el temario **ISTQB® Certified Tester Foundation Level (CTFL v4.0)**: juegos prácticos, filminas por capítulo, una biblioteca de documentación real y exámenes que crea y corrige el profesor.

## Puesta en marcha

### Publicar en internet (Supabase + Vercel)

Sigue la guía [`docs/deploy.md`](docs/deploy.md): crear la base en Supabase (un script SQL), importar el repositorio en Vercel y cargar dos variables de entorno. El resultado es una URL para compartir.

### En tu computadora

Requiere Node.js 20 o superior.

```bash
npm install
npm start               # http://localhost:3000, datos en data/db.json
npm run start:supabase  # igual, pero con los datos en Supabase (variables en .env.local)
npm test                # pruebas de la API (archivo y Supabase simulado)
```

La **primera cuenta que se registra es la del profesor administrador**. Después, los alumnos crean sus propias cuentas desde la misma pantalla.

Variables de entorno:

| Variable | Uso |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Si están definidas, los datos se guardan en Supabase. Obligatorias en Vercel. |
| `TEACHER_CODE` | Si se define, quien se registre con este código obtiene rol de profesor. |
| `PORT` | Puerto HTTP local (por defecto `3000`). |
| `DATA_FILE` | Archivo local de datos cuando no se usa Supabase (por defecto `data/db.json`). |
| `SECURE_COOKIES=1`, `TRUST_PROXY=1` | Para un servidor propio detrás de HTTPS o de un proxy. En Vercel ya están activados. |

## Qué incluye

**Para alumnos**
- **Juegos (18)** organizados por capítulo del temario: error/defecto/fallo, los 7 principios, proceso de prueba, niveles y tipos, revisiones, particiones y valores límite, tablas de decisión, transición de estados, cobertura de código, reportes de defectos, riesgos, gestión, una sesión exploratoria sobre una tienda con bugs sembrados y un simulacro de examen cronometrado.
- **Filminas** de los 6 capítulos, con modo pantalla completa, navegación con teclado, notas para presentar e impresión a PDF (una filmina por página).
- **Biblioteca** con enlaces a documentación real: temario oficial en español (HASTQB/SSTQB), exámenes de ejemplo, glosario ISTQB, normas ISO, artículos de referencia (pirámide de pruebas, cuadrantes, SBTM) y documentación de herramientas.
- **Mis exámenes**: rendir con temporizador, entrega automática al vencer el tiempo y revisión de respuestas si el profesor la habilita.
- **Simulacro oficial**: 40 preguntas, 60 minutos (75 si rindes en otro idioma), aprueba con 26, misma cantidad de preguntas por capítulo que el examen real, marcar para revisar y resultado por capítulo.
- **Repaso espaciado** (sistema Leitner de 5 cajas): las preguntas que fallas vuelven en 1, 2, 4, 8 y 16 días. Incluye meta diaria y racha.
- **Preparación**: aciertos por cada tema del temario, estimación del puntaje sobre 40, práctica de temas débiles e informe imprimible.
- **Bug Hunt con informes**: para confirmar un bug hay que redactar el informe de defecto, que se califica con una rúbrica.
- **Reportar preguntas** con errores desde cualquier juego o simulacro.
- Progreso, XP, niveles e insignias guardados en la cuenta.

**Para profesores**
- Crear, editar, duplicar, publicar y eliminar exámenes. Preguntas propias o importadas del banco ISTQB, tiempo límite, porcentaje de aprobación, intentos, fecha límite y asignación a todos o a alumnos concretos.
- Resultados por examen: notas, pendientes, aciertos por pregunta y exportación a CSV.
- Alumnos: avance en los juegos, exámenes rendidos, cambio de rol y restablecimiento de contraseña.
- Generar un examen de 40 preguntas con la distribución oficial por capítulo con un clic.
- Ver los temas que más le cuestan al curso, el último simulacro de cada alumno y sus aciertos por tema.
- Revisar la cola de preguntas reportadas.
- Agregar o quitar documentos de la biblioteca.

El análisis de la competencia que motivó estas funciones está en [`docs/benchmark.md`](docs/benchmark.md).

## Seguridad

- Contraseñas con `scrypt` y sal; sesiones en cookie `HttpOnly` y `SameSite=Strict`; en el servidor solo se guarda el hash del token.
- Las respuestas correctas nunca se envían al navegador del alumno antes de entregar; la corrección se hace en el servidor.
- Límite de intentos de inicio de sesión, validación de todas las entradas y cabeceras CSP.

## Estructura

```
server/          API REST (Node) y capa de datos (archivo local o Supabase)
api/index.js     función serverless de Vercel que expone la API
supabase/        esquema SQL de la base
scripts/         migración de data/db.json a Supabase
public/          aplicación web
  js/core.js     estado, XP, insignias y motores de juego
  js/games/      un archivo por capítulo + bug hunt + simulacro
  js/bank.js     banco de 66 preguntas v4.0 (sección, nivel K, explicación)
  js/views-study.js  repaso, simulacro oficial y preparación
  js/slides-data.js  contenido de las filminas
  js/views-*.js  pantallas (aprendizaje, exámenes, profesor)
test/            pruebas de la API (node:test) con ambos backends
```

> Proyecto educativo inspirado en el temario ISTQB®; no está afiliado oficialmente a ISTQB®. Los enlaces de la biblioteca apuntan a los sitios originales.
