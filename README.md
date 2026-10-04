# 🐞 QA Academy — Aprende a ser tester jugando

Aplicación web educativa con **mini-juegos** para aprender testing de software siguiendo el temario **ISTQB® Certified Tester Foundation Level (CTFL v4.0)**.

## Cómo ejecutarla

Es una app estática (HTML + CSS + JavaScript, sin dependencias ni build):

```bash
# opción 1: abrir index.html directamente en el navegador
# opción 2: servirla localmente
python3 -m http.server 8000   # luego abrir http://localhost:8000
```

También puede publicarse tal cual en GitHub Pages, Netlify, etc.

## Contenido (18 juegos)

| Capítulo ISTQB | Juegos |
|---|---|
| 1. Fundamentos | ¿Error, defecto o fallo? · Los 7 principios · El proceso de prueba (ordenar actividades + testware) · QA, QC y depuración |
| 2. Ciclo de vida | Niveles de prueba · Tipos de prueba · Shift-left, TDD/BDD/ATDD, DevOps y mantenimiento |
| 3. Pruebas estáticas | Cazador de defectos en requisitos (revisión de documentos y código) · Revisiones y roles |
| 4. Técnicas | Particiones y valores límite (BVA 2 y 3 valores) · Tablas de decisión interactivas · Transición de estados (diagrama) · Elige la técnica (cobertura de sentencias/ramas, experiencia, colaboración) |
| 5. Gestión | El reporte de defectos perfecto · Pruebas basadas en riesgo · El test manager (estimación, criterios, pirámide, cuadrantes, herramientas) |
| Práctica | **Bug Hunt: Tienda QA** — sesión exploratoria sobre una tienda con 6 bugs sembrados · **Simulacro de examen** cronometrado (aprobación 65%) |

## Gamificación

- **XP y niveles**: de *Aprendiz de Tester* a *Leyenda ISTQB*.
- **Estrellas** por juego (50% / 70% / 90%).
- **Insignias**: Cazabugs, Ojo de halcón, Maestro de técnicas, Listo para certificar, etc.
- Cada juego incluye un **repaso de teoría** y explicaciones tras cada respuesta.
- El progreso se guarda en el navegador (`localStorage`).

## Estructura

```
index.html
css/styles.css
js/core.js            # estado, XP, insignias y motores reutilizables (quiz, ordenar, selección múltiple)
js/app.js             # enrutador, mapa, glosario y progreso
js/games/*.js         # un archivo por capítulo + bug hunt + examen
```

Para agregar un juego: llama a `QA.registerGame({ id, chapter, icon, title, desc, xp, theory, play(root, done) })` y finaliza con `done(puntaje, maximo)`.

> Proyecto educativo inspirado en el temario ISTQB®; no está afiliado oficialmente a ISTQB®.
