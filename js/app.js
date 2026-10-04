/* QA Academy - enrutador y pantallas principales. */
(() => {
  const { h, starsHtml } = QA;
  const app = document.getElementById('app');

  const GLOSSARY = [
    ['Prueba (testing)', 'Conjunto de actividades para descubrir defectos y evaluar la calidad de los artefactos de software.'],
    ['Error (equivocación)', 'Acción humana que produce un resultado incorrecto.'],
    ['Defecto', 'Imperfección o deficiencia en un producto de trabajo que no cumple sus requisitos.'],
    ['Fallo', 'Evento en el que un componente o sistema no realiza una función requerida dentro de los límites especificados.'],
    ['Causa raíz', 'Fuente de un defecto que, si se elimina, reduce o elimina la ocurrencia de ese tipo de defecto.'],
    ['Base de prueba', 'Conocimiento usado como fundamento para el análisis y diseño de pruebas (requisitos, historias, diseño…).'],
    ['Condición de prueba', 'Aspecto comprobable de un componente o sistema identificado como base para las pruebas.'],
    ['Caso de prueba', 'Conjunto de precondiciones, entradas, acciones, resultados esperados y postcondiciones.'],
    ['Procedimiento de prueba', 'Secuencia de casos de prueba en orden de ejecución, con las acciones de preparación y cierre.'],
    ['Oráculo de prueba', 'Fuente para determinar el resultado esperado y compararlo con el real.'],
    ['Testware', 'Productos de trabajo generados durante el proceso de prueba.'],
    ['Cobertura', 'Grado, expresado en porcentaje, en que los elementos de cobertura han sido ejercitados por las pruebas.'],
    ['Trazabilidad', 'Relación entre la base de prueba y el testware, y entre los productos de trabajo.'],
    ['Pruebas estáticas', 'Pruebas que no implican la ejecución del objeto de prueba: revisiones y análisis estático.'],
    ['Pruebas dinámicas', 'Pruebas que implican la ejecución del objeto de prueba.'],
    ['Pruebas de confirmación', 'Pruebas que verifican que un defecto fue corregido correctamente (re-test).'],
    ['Pruebas de regresión', 'Pruebas que verifican que un cambio no causó consecuencias negativas en partes no modificadas.'],
    ['Pruebas de mantenimiento', 'Pruebas tras cambios en un sistema en operación: correcciones, mejoras, migraciones, retiro.'],
    ['Particiones de equivalencia', 'Técnica de caja negra que divide los datos en particiones que se espera se procesen igual.'],
    ['Análisis de valores límite', 'Técnica de caja negra que ejercita los límites de particiones ordenadas.'],
    ['Tabla de decisión', 'Técnica de caja negra para combinaciones de condiciones y sus acciones resultantes.'],
    ['Transición de estados', 'Técnica de caja negra que modela estados, eventos y transiciones del sistema.'],
    ['Cobertura de sentencias', 'Porcentaje de sentencias ejecutables ejercitadas por las pruebas.'],
    ['Cobertura de ramas', 'Porcentaje de ramas (resultados de decisiones) ejercitadas por las pruebas.'],
    ['Predicción de errores', 'Técnica basada en la experiencia que anticipa errores, defectos y fallos probables.'],
    ['Pruebas exploratorias', 'Diseño, ejecución y evaluación simultáneos, guiados por el aprendizaje y a menudo por un charter.'],
    ['Riesgo', 'Factor que podría producir consecuencias negativas futuras; se mide por probabilidad e impacto.'],
    ['Criterios de entrada', 'Condiciones que deben cumplirse para comenzar una actividad (definition of ready).'],
    ['Criterios de salida', 'Condiciones que deben cumplirse para dar por terminada una actividad (definition of done).'],
    ['Severidad', 'Grado de impacto que tiene un defecto sobre el desarrollo o el funcionamiento del sistema.'],
    ['Prioridad', 'Nivel de importancia/urgencia asignado a la corrección de un defecto.'],
    ['Shift-left', 'Enfoque que realiza las pruebas lo antes posible en el ciclo de vida.'],
    ['Pirámide de pruebas', 'Modelo que muestra que las pruebas de bajo nivel deben ser más numerosas que las de alto nivel.'],
  ];

  function setActiveNav(path) {
    document.querySelectorAll('.nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${path}`);
    });
  }

  /* ---------- Inicio: mapa de capítulos ---------- */
  function home() {
    const s = QA.state;
    const played = QA.games.filter(g => s.results[g.id]).length;
    const stars = QA.games.reduce((n, g) => n + ((s.results[g.id] || {}).stars || 0), 0);
    const { cur } = QA.levelFor(s.xp);

    const hero = h('section', { class: 'hero' },
      h('div', null,
        h('h1', null, '¡Conviértete en tester jugando! 🐞'),
        h('p', null, 'Mini-juegos basados en el temario oficial ISTQB Foundation Level: fundamentos, ciclo de vida, pruebas estáticas, técnicas de diseño, gestión de pruebas y una sesión exploratoria real para cazar bugs.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: `#/juego/${nextGame().id}` }, played ? '▶ Continuar' : '▶ Empezar'),
          h('a', { class: 'btn', href: '#/juego/bug-hunt' }, '🐞 Ir a cazar bugs')
        )
      ),
      h('div', { class: 'hero-stats' },
        h('div', { class: 'card stat' }, h('b', null, `${played}/${QA.games.length}`), h('span', null, 'juegos jugados')),
        h('div', { class: 'card stat' }, h('b', null, `${stars}/${QA.games.length * 3}`), h('span', null, 'estrellas')),
        h('div', { class: 'card stat' }, h('b', null, cur.icon), h('span', null, cur.name))
      )
    );

    const chapters = QA.CHAPTERS.map(ch => {
      const list = QA.games.filter(g => g.chapter === ch.id);
      if (!list.length) return null;
      return h('section', { class: 'chapter' },
        h('div', { class: 'chapter-head' },
          h('span', { class: 'tag' }, ch.id <= 5 ? `CAPÍTULO ${ch.id}` : 'PRÁCTICA'),
          h('h2', null, ch.title)
        ),
        h('p', { class: 'chapter-desc' }, ch.desc),
        h('div', { class: 'grid' }, list.map(gameCard))
      );
    });

    app.replaceChildren(hero, ...chapters.filter(Boolean));
  }

  function nextGame() {
    return QA.games.find(g => !QA.state.results[g.id]) ||
      QA.games.find(g => (QA.state.results[g.id] || {}).stars < 3) ||
      QA.games[0];
  }

  function gameCard(g) {
    const r = QA.getResult(g.id);
    return h('a', { class: 'card game-card', href: `#/juego/${g.id}` },
      h('span', { class: 'icon' }, g.icon),
      h('h3', null, g.title),
      h('p', null, g.desc),
      h('div', { class: 'meta' },
        starsHtml(r ? r.stars : 0),
        h('span', null, r ? `Récord ${r.best}%` : `Hasta ${g.xp} XP`)
      )
    );
  }

  /* ---------- Pantalla de juego ---------- */
  function gameScreen(id) {
    const g = QA.games.find(x => x.id === id);
    if (!g) return notFound();
    const r = QA.getResult(g.id);
    const playRoot = h('div');
    app.replaceChildren(
      h('div', { class: 'game-header' },
        h('a', { class: 'btn small', href: '#/' }, '← Mapa'),
        h('span', { class: 'icon' }, g.icon),
        h('div', null,
          h('h1', null, g.title),
          h('p', null, g.desc)
        ),
        h('span', { class: 'spacer' }),
        r ? h('div', null, starsHtml(r.stars), h('div', { class: 'muted', style: 'font-size:.8rem' }, `Récord: ${r.best}%`)) : null
      ),
      h('details', { class: 'theory', open: !r },
        h('summary', null, '📚 Repaso de teoría'),
        h('div', { html: g.theory })
      ),
      playRoot
    );
    g.play(playRoot, (score, max, extra) => QA.showResult(playRoot, g, score, max, extra));
  }

  /* ---------- Glosario ---------- */
  function glossary() {
    const list = h('dl', { class: 'gloss' });
    const render = term => {
      const q = term.trim().toLowerCase();
      list.replaceChildren(...GLOSSARY
        .filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q))
        .map(([t, d]) => h('div', { class: 'card' }, h('dt', null, t), h('dd', null, d))));
    };
    const input = h('input', { class: 'search', type: 'search', placeholder: '🔍 Buscar término…', oninput: e => render(e.target.value) });
    app.replaceChildren(
      h('h1', null, '📖 Glosario de testing'),
      h('p', { class: 'muted' }, 'Términos clave del glosario ISTQB que aparecen en los juegos.'),
      input,
      list
    );
    render('');
  }

  /* ---------- Progreso ---------- */
  function progress() {
    const s = QA.state;
    const { idx } = QA.levelFor(s.xp);
    const rows = QA.games.map(g => {
      const r = s.results[g.id];
      return h('tr', null,
        h('td', null, `${g.icon} ${g.title}`),
        h('td', null, starsHtml(r ? r.stars : 0)),
        h('td', null, r ? `${r.best}%` : '—'),
        h('td', null, r ? r.plays : 0)
      );
    });
    app.replaceChildren(
      h('h1', null, '📈 Tu progreso'),
      h('p', { class: 'muted' }, `Tienes ${s.xp} XP. Tu progreso se guarda en este navegador.`),
      h('h2', null, '🏅 Insignias'),
      h('div', { class: 'badges' }, QA.BADGES.map(b =>
        h('div', { class: `card badge ${s.badges.includes(b.id) ? '' : 'locked'}` },
          h('span', { class: 'b-icon' }, b.icon),
          h('div', null, h('h4', null, b.name), h('p', null, b.desc))
        ))),
      h('h2', null, '🎚️ Niveles'),
      h('div', { class: 'levels' }, QA.LEVELS.map((l, i) =>
        h('div', { class: i === idx ? 'current' : '' }, h('span', null, `${l.icon} ${l.name}`), h('span', null, `${l.xp} XP`)))),
      h('h2', null, '🎮 Juegos'),
      h('div', { class: 'card table-wrap' },
        h('table', { class: 'dt' },
          h('thead', null, h('tr', null, h('th', null, 'Juego'), h('th', null, 'Estrellas'), h('th', null, 'Mejor'), h('th', null, 'Partidas'))),
          h('tbody', null, rows)
        )
      ),
      h('div', { class: 'actions' },
        h('button', {
          class: 'btn',
          onclick: () => {
            if (confirm('¿Seguro que quieres borrar todo tu progreso?')) { QA.resetProgress(); progress(); }
          },
        }, '🗑️ Reiniciar progreso')
      )
    );
  }

  function notFound() {
    app.replaceChildren(h('div', { class: 'card' }, h('h1', null, 'Página no encontrada'), h('a', { href: '#/' }, 'Volver al mapa')));
  }

  function route() {
    const path = (location.hash || '#/').slice(1);
    setActiveNav(path.startsWith('/juego') ? '/' : path);
    const m = path.match(/^\/juego\/([\w-]+)$/);
    if (m) gameScreen(m[1]);
    else if (path === '/glosario') glossary();
    else if (path === '/progreso') progress();
    else if (path === '/' || path === '') home();
    else notFound();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  QA.renderPlayer();
  route();
})();
