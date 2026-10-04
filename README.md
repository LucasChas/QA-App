# QA Academy

Plataforma de capacitación en testing de software basada en el temario **ISTQB® Certified Tester Foundation Level (CTFL v4.0)**: juegos prácticos, filminas por capítulo, una biblioteca de documentación real y exámenes que crea y corrige el profesor.

## Puesta en marcha

Requiere Node.js 18 o superior. No tiene dependencias externas.

```bash
npm start            # http://localhost:3000
npm test             # pruebas de la API
```

La **primera cuenta que se registra es la del profesor administrador**. Después, los alumnos crean sus propias cuentas desde la misma pantalla.

Variables de entorno opcionales:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP (por defecto `3000`). |
| `DATA_FILE` | Archivo donde se guardan los datos (por defecto `data/db.json`). Haz copias de seguridad de este archivo. |
| `TEACHER_CODE` | Si se define, quien se registre con este código obtiene rol de profesor. |
| `SECURE_COOKIES=1` | Marca la cookie de sesión como `Secure` (actívalo detrás de HTTPS). |

Para publicarla en internet sirve cualquier servicio que ejecute Node (Render, Railway, Fly.io, un VPS…) con un disco persistente para `DATA_FILE` y HTTPS delante.

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
server/          API REST (Node, sin dependencias) y almacenamiento en JSON
public/          aplicación web
  js/core.js     estado, XP, insignias y motores de juego
  js/games/      un archivo por capítulo + bug hunt + simulacro
  js/bank.js     banco de 66 preguntas v4.0 (sección, nivel K, explicación)
  js/views-study.js  repaso, simulacro oficial y preparación
  js/slides-data.js  contenido de las filminas
  js/views-*.js  pantallas (aprendizaje, exámenes, profesor)
test/            pruebas de la API (node:test)
```

> Proyecto educativo inspirado en el temario ISTQB®; no está afiliado oficialmente a ISTQB®. Los enlaces de la biblioteca apuntan a los sitios originales.
