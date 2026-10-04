# Benchmark: plataformas para aprender testing e ISTQB

Fecha: octubre de 2026. Objetivo: comparar QA Academy con productos que resuelven el mismo problema, encontrar sus deficiencias y mejorar sobre ellas.

**Método y límites.** Desde el entorno de desarrollo no se pudieron abrir los sitios: la red bloquea las descargas directas. La información sale de resultados de búsqueda (fichas de tiendas de aplicaciones, reseñas, foros y páginas de producto).
- **[V]**: se vio en un resultado de búsqueda.
- **[I]**: es una inferencia a partir del tipo de producto o de no haber encontrado la función. Conviene verificarlo a mano antes de citarlo hacia afuera.

## Productos analizados

| Producto | Categoría | Lo que hace bien | Deficiencias principales |
|---|---|---|---|
| [ScrumPass ISTQB Exam Simulator](https://play.google.com/store/apps/details?id=com.scrumpass.istqb.foundation) | App de simulacros | Preguntas redactadas por expertos, resumen de puntos débiles [V] | 3,1 estrellas en Play; reseñas sobre respuestas erróneas sin explicación; suscripción de USD 3,99/mes [V]. Solo inglés, sin aula [I] |
| Apps con publicidad de Google Play ("ISTQB Quiz", "ISTQB Test Prep", etc.) | App de simulacros | Gratuitas, móviles [V] | Publicidad; reseñas como "muchas respuestas incorrectas… contenido copiado sin validar"; algunas siguen el temario v3.1, retirado en mayo de 2024 [V] |
| [Exámenes de ejemplo oficiales ISTQB / HASTQB](https://www.hastqb.org/herramientas/) | PDF oficial | La fuente más confiable: objetivo de aprendizaje, nivel K y justificación por pregunta; formato 40 preguntas / 60 min; existe en español [V] | PDF estático: sin tiempo, sin corrección ni estadísticas. Pocos juegos de preguntas, se agotan rápido [I] |
| [Udemy: tests de práctica CTFL v4.0](https://www.udemy.com/course/istqb-foundation-level-ctfl-practice-test-s/) | Curso pago | 250–400 preguntas con explicación y tiempo; valoraciones de 4,1 a 4,6 [V] | Pago; algunos exámenes de 75 preguntas, distinto del formato real [V]. Solo opción múltiple, sin práctica ni aula [I] |
| [Quizlet ISTQB](https://quizlet.com/subject/istqb/) | Tarjetas | Tarjetas hechas por la comunidad [V] | Conjuntos antiguos (p. ej. glosario de 2018) [V]; sin revisión de calidad [I] |
| [ISTQBeasy](https://istqbeasy.com/) | Web de simulacros en español | Gratis y sin registro; más de 357 preguntas v4.0 en ES/EN/FR con explicación; notas por capítulo [V] | Sin cuentas: el progreso no se comparte con un docente [V/I]. Sin aula ni práctica aplicada [I] |
| [QARMY](https://qarmy.ar/simulador-istqb/) | Simulador en español | Gratis; exámenes oficiales en español con el inglés al lado; resultado por capítulo y explicación [V] | Solo el conjunto oficial de preguntas [V]. Sin repaso espaciado, sin aula, solo opción múltiple [I] |
| [ProSTQB](https://prostqb.com/en) | Web de simulacros | Modos de estudio y examen; "volver a las preguntas difíciles"; tendencias [V] | La repetición espaciada solo se recomienda en las preguntas frecuentes, no está implementada [V]. Solo inglés [I] |
| [Test Automation University](https://testautomationu.com) | Cursos gratuitos | Más de 70 cursos gratuitos [V] | Enfocado en automatización; sin relación con ISTQB [V/I]. Solo inglés, mayormente videos [I] |
| [Ministry of Testing](https://www.ministryoftesting.com/courses) | Comunidad y cursos | Comunidad fuerte, cursos prácticos [V] | Pro cuesta £24,99/mes [V]; no prepara para ISTQB [I] |
| [uTest Academy](https://utest.com) | Formación de crowdtesting | Enseña a redactar informes de defectos [V] | Orientado a reclutar testers, no a ISTQB; sin docente [V/I] |
| [Coursera: Practical Software Testing](https://www.coursera.org/learn/practical-software-testing) | Curso universitario | Calidad académica [V] | Reseñas que piden "más escenarios reales y práctica guiada" [V]. Certificado pago [I] |
| Campos de práctica: [Toolshop](https://practicesoftwaretesting.com), [The Internet](https://the-internet.herokuapp.com), [Restful-booker](https://restful-booker.herokuapp.com), [ParaBank](https://parabank.parasoft.com), [Test Pages](https://testpages.eviltester.com) | Aplicaciones con bugs | Bugs sembrados realistas [V] | Sin solucionario ni corrección: los alumnos publican sus hallazgos en GitHub para compararlos [V]. Sin relación con técnicas ISTQB [I] |
| Kahoot, Wayground (ex Quizizz), Google Forms, Moodle | Herramientas de aula | Fáciles de usar en clase [V] | Kahoot gratis: 10 jugadores, preguntas de 120 caracteres y respuestas de 75. Wayground gratis: 20 actividades. Forms: sin temporizador ni sorteo de preguntas. Moodle: configuración compleja [V]. Sin tipos de pregunta propios de QA [I] |

## Matriz comparativa

S = sí · P = parcial · N = no · ? = sin datos

| Producto | v4.0 | Español | Explicaciones | Práctica aplicada | Redactar informes | Aula / docente | Temas débiles | Repaso de errores | Formato 40/60 | Gratis sin anuncios |
|---|---|---|---|---|---|---|---|---|---|---|
| ScrumPass | S | N | P | N | N | N | S | ? | S | N |
| Apps con publicidad | P | N | P | N | N | N | P | N | P | N |
| PDF oficiales | S | S | S | N | N | N | N | N | S (estático) | S |
| Udemy | S | P | S | N | N | N | P | N | P | N |
| ISTQBeasy | S | S | S | N | N | N | P | ? | S | S |
| QARMY | S | S | S | N | N | N | P | N | S | S |
| ProSTQB | S | N | S | N | N | N | S | P | S | ? |
| Campos de práctica | – | N | N | S | N (sin corrección) | N | N | N | N | S |
| Kahoot / Forms / Moodle | – | S | P | N | N | S | P | N | P | P |
| **QA Academy (antes)** | S | S | P | S | P | S | P | N | N (20 preguntas) | S |
| **QA Academy (ahora)** | S | S | S | S | S (con rúbrica) | S | S (por tema del temario) | S | S | S |

## Deficiencias del mercado y cómo las resolvimos

| # | Deficiencia | Evidencia | Qué agregamos a QA Academy |
|---|---|---|---|
| 1 | Respuestas incorrectas o sin explicar; contenido v3.1 | Reseñas de ScrumPass y de apps de Play; conjuntos de Quizlet de 2018 | Banco ampliado de 34 a **66 preguntas v4.0**, cada una con **explicación, sección del temario y nivel K**. Botón **"Reportar un problema con esta pregunta"** en juegos y simulacros, con una **cola de reportes** para el profesor que agrupa los reportes repetidos |
| 2 | Simulacros con un formato distinto al real | Udemy con 75 preguntas; nuestro simulacro anterior tenía 20 | **Simulacro oficial**: 40 preguntas, 60 minutos, aprueba con 26; preguntas sorteadas con la **misma cantidad por capítulo que el examen real** (8-6-4-11-9-2); opción de **75 minutos** para quien rinde en un idioma que no es el suyo; **marcar para revisar**; se retoma si se recarga la página; historial y resultado por capítulo |
| 3 | Nadie ofrece repaso espaciado | ProSTQB solo lo recomienda | **Repaso con sistema Leitner** (5 cajas: 1, 2, 4, 8 y 16 días). Las preguntas falladas en juegos, simulacros y exámenes del profesor entran solas; **meta diaria**, **racha** y dos insignias nuevas |
| 4 | Análisis de puntos débiles solo por capítulo | QARMY, ScrumPass | **Aciertos por cada uno de los 22 temas del temario**, **estimación del puntaje sobre 40** ponderada por el peso de cada capítulo en el examen, botón **"Practicar mis temas débiles"** e **informe imprimible** |
| 5 | La práctica aplicada no corrige nada | Toolshop, Restful-booker, ParaBank | En el Bug Hunt, para confirmar un bug hay que **reproducirlo y redactar un informe** (título, pasos, esperado frente a real, severidad), que se califica con una **rúbrica automática** con consejos |
| 6 | Nadie enseña a redactar informes de defectos a escala | uTest está atado a su plataforma; Kahoot limita las respuestas a 75 caracteres | La misma rúbrica: 2 puntos por encontrar el bug y hasta 4 por la calidad del informe |
| 7 | Las herramientas de aula no tienen contenido de QA | Kahoot, Forms, Moodle | El editor de exámenes **genera un simulacro oficial de 40 preguntas** con un clic. El panel de alumnos muestra **los temas que más le cuestan al curso** y cuántos aprobaron el simulacro. La ficha de cada alumno muestra sus aciertos por tema y sus simulacros |
| 8 | Lo que hay en español no tiene cuentas ni aula | ISTQBeasy, QARMY | QA Academy ya combinaba español, cuentas y rol docente; ahora suma el resto de los puntos de esta tabla |
| 9 | Publicidad, suscripciones y límites en planes gratuitos | Kahoot, Wayground, ScrumPass | Se mantiene gratis, sin anuncios e instalable en un servidor propio |

## Pendiente (identificado pero no implementado)

- **Preguntas bilingües ES/EN** con un botón "ver en inglés": útil para quienes rinden en inglés. Requiere traducir y revisar las 66 preguntas.
- **Modo sin conexión (PWA)**: almacenar los juegos y el banco en caché y sincronizar las respuestas al volver la conexión.
- **Sorteo por alumno en exámenes del profesor**: hoy el profesor genera el examen desde el banco, pero todos reciben las mismas preguntas.
- **Ajuste manual del docente** sobre la nota de la rúbrica del Bug Hunt, e inclusión en el CSV.
- **Etiquetado por objetivo de aprendizaje** (FL-x.y.z): hoy las preguntas se etiquetan por sección (x.y) y nivel K. Los códigos exactos de cada objetivo conviene tomarlos del programa oficial antes de agregarlos.
