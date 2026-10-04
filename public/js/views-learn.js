/* Pantallas de aprendizaje: inicio, juegos, filminas, biblioteca, glosario, progreso y cuenta. */
const LearnViews = (() => {
  const { h, starsHtml } = QA;
  const { pageHead, btn, chip, icon, empty, loading, fmtDay, meter } = UI;

  const REFS = {
    'error-defecto-fallo': '§1.2.3', 'siete-principios': '§1.3', 'proceso-pruebas': '§1.4', 'por-que-probar': '§1.1–1.2',
    'niveles-prueba': '§2.2.1', 'tipos-prueba': '§2.2.2–2.2.3', 'sdlc-shift-left': '§2.1, §2.3',
    'revision-requisitos': '§3.1', 'tipos-revision': '§3.2',
    'particiones-limites': '§4.2.1–4.2.2', 'tabla-decision': '§4.2.3', 'transicion-estados': '§4.2.4', 'elige-tecnica': '§4.3–4.5',
    'reporte-defectos': '§5.5', 'riesgos': '§5.2', 'gestion-pruebas': '§5.1, §5.3–5.4, §6',
    'bug-hunt': '§4.4.2', 'examen': 'Todo el temario',
  };

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
    ['Prioridad', 'Nivel de importancia o urgencia asignado a la corrección de un defecto.'],
    ['Shift-left', 'Enfoque que realiza las pruebas lo antes posible en el ciclo de vida.'],
    ['Pirámide de pruebas', 'Modelo que muestra que las pruebas de bajo nivel deben ser más numerosas que las de alto nivel.'],
  ];

  const nextGame = () => QA.games.find(g => !QA.state.results[g.id]) ||
    QA.games.find(g => (QA.state.results[g.id] || {}).stars < 3) || QA.games[0];

  function chapterStats(chId) {
    const list = QA.games.filter(g => g.chapter === chId);
    const stars = list.reduce((n, g) => n + ((QA.state.results[g.id] || {}).stars || 0), 0);
    return { list, stars, max: list.length * 3 };
  }

  /* ---------- Inicio ---------- */
  function home(app, user) {
    const s = QA.state;
    const { cur, next, pct } = QA.levelFor(s.xp);
    const played = QA.games.filter(g => s.results[g.id]).length;
    const ng = nextGame();
    const examsBox = h('div', null, loading());

    app.replaceChildren(
      pageHead(`Hola, ${user.name.split(' ')[0]}`, played
        ? `Llevas ${played} de ${QA.games.length} juegos. Sigue con el temario donde lo dejaste.`
        : 'Empieza por los fundamentos: cada juego tiene un repaso de teoría antes de jugar.'),
      h('div', { class: 'dash' },
        h('section', { class: 'panel dash-next' },
          h('span', { class: 'eyebrow' }, 'Siguiente actividad'),
          h('div', { class: 'next-row' },
            h('span', { class: 'game-ico lg' }, icon(ng.icon, 26)),
            h('div', null, h('h2', null, ng.title), h('p', { class: 'muted' }, ng.desc))),
          h('div', { class: 'row' },
            btn(played ? 'Continuar' : 'Empezar', { variant: 'primary', href: `#/juego/${ng.id}` }),
            btn('Ver filminas del capítulo', { href: `#/filminas/cap${Math.min(ng.chapter, 6)}` }))),
        h('section', { class: 'panel dash-level' },
          h('span', { class: 'eyebrow' }, 'Tu nivel'),
          h('div', { class: 'level-name' }, cur.name),
          meter(pct),
          h('p', { class: 'muted small' }, next ? `${s.xp} XP · faltan ${next.xp - s.xp} para ${next.name}` : `${s.xp} XP · nivel máximo`),
          h('a', { class: 'link', href: '#/progreso' }, 'Ver progreso e insignias'))
      ),
      h('div', { class: 'dash two' },
        h('section', { class: 'panel' },
          h('div', { class: 'panel-head' }, h('h2', null, 'Avance por capítulo'), h('a', { class: 'link', href: '#/juegos' }, 'Todos los juegos')),
          h('ul', { class: 'ch-list' }, QA.CHAPTERS.map(ch => {
            const st = chapterStats(ch.id);
            return h('li', null,
              h('span', { class: 'ch-ref' }, ch.id <= 5 ? `Cap. ${ch.id}` : 'Práctica'),
              h('span', { class: 'ch-title' }, ch.title),
              meter(st.max ? (st.stars / st.max) * 100 : 0),
              h('span', { class: 'ch-num' }, `${st.stars}/${st.max}`));
          }))),
        h('section', { class: 'panel' },
          h('div', { class: 'panel-head' }, h('h2', null, user.role === 'profesor' ? 'Exámenes del curso' : 'Exámenes asignados'),
            h('a', { class: 'link', href: user.role === 'profesor' ? '#/profesor/examenes' : '#/examenes' }, 'Ver todos')),
          examsBox)
      )
    );

    API.get('/api/exams').then(({ exams }) => {
      if (user.role === 'profesor') {
        const list = exams.slice(0, 4);
        examsBox.replaceChildren(list.length ? h('ul', { class: 'mini-list' }, list.map(e => h('li', null,
          h('a', { href: `#/profesor/examenes/${e.id}/resultados` }, e.title),
          chip(e.published ? 'Publicado' : 'Borrador', e.published ? 'ok' : ''),
          h('span', { class: 'muted small' }, `${e.takers}/${e.assignedCount} entregas`)))) :
          empty('Todavía no hay exámenes', 'Crea uno desde el panel del profesor.'));
        return;
      }
      const pending = exams.filter(e => e.status === 'disponible' || e.status === 'en-curso');
      examsBox.replaceChildren(pending.length ? h('ul', { class: 'mini-list' }, pending.map(e => h('li', null,
        h('a', { href: `#/examenes/${e.id}` }, e.title),
        e.dueDate ? h('span', { class: 'muted small' }, `Vence ${fmtDay(e.dueDate)}`) : chip(e.status === 'en-curso' ? 'En curso' : 'Disponible', 'accent')))) :
        empty('Sin exámenes pendientes', 'Cuando tu profesor publique un examen aparecerá aquí.'));
    }).catch(err => examsBox.replaceChildren(h('p', { class: 'muted' }, err.message)));
  }

  /* ---------- Juegos ---------- */
  function gameCard(g) {
    const r = QA.getResult(g.id);
    return h('a', { class: 'game-card', href: `#/juego/${g.id}` },
      h('div', { class: 'gc-top' },
        h('span', { class: 'game-ico' }, icon(g.icon, 20)),
        h('span', { class: 'ref' }, REFS[g.id] || '')),
      h('h3', null, g.title),
      h('p', null, g.desc),
      h('div', { class: 'gc-foot' },
        starsHtml(r ? r.stars : 0),
        h('span', null, r ? `Mejor: ${r.best}%` : `${g.xp} XP`)));
  }

  function games(app) {
    app.replaceChildren(
      pageHead('Juegos', 'Actividades prácticas organizadas según los capítulos del temario ISTQB CTFL v4.0.'),
      ...QA.CHAPTERS.map(ch => {
        const st = chapterStats(ch.id);
        if (!st.list.length) return null;
        return h('section', { class: 'chapter' },
          h('div', { class: 'chapter-head' },
            h('span', { class: 'eyebrow' }, ch.id <= 5 ? `Capítulo ${ch.id}` : 'Práctica'),
            h('h2', null, ch.title),
            h('span', { class: 'muted small' }, `${st.stars} de ${st.max} estrellas`)),
          h('p', { class: 'muted' }, ch.desc),
          h('div', { class: 'grid' }, st.list.map(gameCard)));
      }).filter(Boolean));
  }

  function gameScreen(app, id) {
    const g = QA.games.find(x => x.id === id);
    if (!g) return app.replaceChildren(empty('Juego no encontrado', null, btn('Ver juegos', { href: '#/juegos' })));
    const r = QA.getResult(g.id);
    const playRoot = h('div', { class: 'play' });
    app.replaceChildren(
      h('a', { class: 'back', href: '#/juegos' }, icon('left', 16), 'Juegos'),
      h('header', { class: 'game-head' },
        h('span', { class: 'game-ico lg' }, icon(g.icon, 26)),
        h('div', { class: 'game-head-text' },
          h('span', { class: 'eyebrow' }, `${REFS[g.id] || ''} · hasta ${g.xp} XP`),
          h('h1', null, g.title),
          h('p', null, g.desc)),
        r ? h('div', { class: 'game-best' }, starsHtml(r.stars), h('span', { class: 'muted small' }, `Mejor: ${r.best}%`)) : null),
      h('details', { class: 'theory', open: !r },
        h('summary', null, 'Repaso de teoría'),
        h('div', { class: 'theory-body', html: g.theory })),
      playRoot);
    g.play(playRoot, (score, max, extra) => QA.showResult(playRoot, g, score, max, extra));
  }

  /* ---------- Filminas ---------- */
  function slidesIndex(app) {
    app.replaceChildren(
      pageHead('Filminas', 'Presentaciones de cada capítulo para estudiar o para dar la clase. Usa las flechas del teclado para avanzar.'),
      h('div', { class: 'grid' }, DECKS.map(d => h('a', { class: 'deck-card', href: `#/filminas/${d.id}` },
        h('div', { class: 'deck-thumb' }, h('span', { class: 'eyebrow' }, d.ref), h('strong', null, d.title)),
        h('div', { class: 'deck-meta' }, h('p', null, d.summary), h('span', { class: 'muted small' }, `${d.slides.length} filminas`))))));
  }

  function renderSlide(s, deck) {
    const body = [];
    switch (s.type) {
      case 'title':
        body.push(h('span', { class: 's-kicker' }, s.kicker), h('h2', { class: 's-title-xl' }, s.title), s.subtitle ? h('p', { class: 's-sub' }, s.subtitle) : null);
        break;
      case 'bullets':
        body.push(h('h2', null, s.title), h('ul', { class: 's-bullets' }, s.bullets.map(b => h('li', null, b))));
        break;
      case 'split':
        body.push(h('h2', null, s.title), h('div', { class: 's-split' }, [s.left, s.right].map(col =>
          h('div', { class: 's-col' }, h('h3', null, col.heading), h('ul', null, col.items.map(i => h('li', null, i)))))));
        break;
      case 'steps':
        body.push(h('h2', null, s.title), h('ol', { class: 's-steps' }, s.steps.map(st =>
          h('li', null, h('strong', null, st.label), h('span', null, st.text)))), s.footer ? h('p', { class: 's-foot' }, s.footer) : null);
        break;
      case 'table':
        body.push(h('h2', null, s.title), h('div', { class: 's-table' }, h('table', null,
          h('thead', null, h('tr', null, s.head.map(c => h('th', null, c)))),
          h('tbody', null, s.rows.map(r => h('tr', null, r.map(c => h('td', null, c))))))), s.footer ? h('p', { class: 's-foot' }, s.footer) : null);
        break;
      case 'quote':
        body.push(h('blockquote', null, h('p', null, `“${s.quote}”`), h('cite', null, s.author)));
        break;
      default:
        body.push(h('h2', null, s.title || ''));
    }
    return h('div', { class: `slide slide-${s.type}` },
      h('div', { class: 's-body' }, body),
      h('div', { class: 's-footer' }, h('span', null, `QA Academy · ${deck.ref}`), h('span', null, deck.title)));
  }

  function slideViewer(app, deckId) {
    const deck = DECKS.find(d => d.id === deckId);
    if (!deck) return app.replaceChildren(empty('Presentación no encontrada', null, btn('Ver filminas', { href: '#/filminas' })));
    let i = 0;
    let showNotes = false;
    const stage = h('div', { class: 'stage', tabindex: '0', 'aria-label': 'Presentación; usa las flechas para avanzar' });
    const counter = h('span', { class: 'counter' });
    const notesBox = h('aside', { class: 'notes', hidden: true });
    const thumbs = h('div', { class: 'thumbs' });

    function show() {
      stage.replaceChildren(renderSlide(deck.slides[i], deck));
      counter.textContent = `${i + 1} / ${deck.slides.length}`;
      const n = deck.slides[i].notes;
      notesBox.replaceChildren(h('strong', null, 'Notas para presentar'), h('p', null, n || 'Esta filmina no tiene notas.'));
      notesBox.hidden = !showNotes;
      thumbs.querySelectorAll('button').forEach((b, k) => b.classList.toggle('active', k === i));
    }
    const go = d => { i = Math.max(0, Math.min(deck.slides.length - 1, i + d)); show(); };

    deck.slides.forEach((s, k) => thumbs.append(h('button', {
      class: 'thumb', onclick: () => { i = k; show(); }, title: s.title || s.quote || '',
    }, h('span', null, k + 1), s.title || 'Cita')));

    const onKey = e => {
      if (!document.body.contains(stage)) { document.removeEventListener('keydown', onKey); return; }
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    document.addEventListener('keydown', onKey);

    const presenter = h('div', { class: 'presenter' }, stage,
      h('div', { class: 'stage-bar' },
        h('button', { class: 'icon-btn', 'aria-label': 'Anterior', onclick: () => go(-1) }, icon('left')),
        counter,
        h('button', { class: 'icon-btn', 'aria-label': 'Siguiente', onclick: () => go(1) }, icon('right')),
        h('span', { class: 'spacer' }),
        btn('Notas', { small: true, icon: 'notes', onclick: () => { showNotes = !showNotes; show(); } }),
        btn('Pantalla completa', { small: true, icon: 'expand', onclick: () => {
          const el = presenter;
          if (document.fullscreenElement) document.exitFullscreen();
          else if (el.requestFullscreen) el.requestFullscreen().catch(() => QA.toast('Tu navegador no permitió la pantalla completa.'));
        } }),
        btn('Imprimir / PDF', { small: true, icon: 'printer', onclick: () => window.print() })),
      notesBox);

    app.replaceChildren(
      h('a', { class: 'back', href: '#/filminas' }, icon('left', 16), 'Filminas'),
      pageHead(deck.title, `${deck.ref} · ${deck.summary}`),
      presenter,
      thumbs,
      h('div', { class: 'print-deck' }, deck.slides.map(s => renderSlide(s, deck))));
    show();
    stage.focus({ preventScroll: true });
  }

  /* ---------- Biblioteca ---------- */
  function library(app, user) {
    const box = h('div', null, loading());
    const teacher = user.role === 'profesor';
    let docs = [];
    let filter = '';
    let lang = 'todos';

    const search = h('input', { id: 'lib-search', class: 'input', type: 'search', placeholder: 'Buscar por título o tema', oninput: e => { filter = e.target.value.toLowerCase(); render(); } });
    const langSel = h('select', { id: 'lib-lang', class: 'input', onchange: e => { lang = e.target.value; render(); } },
      h('option', { value: 'todos' }, 'Todos los idiomas'), h('option', { value: 'es' }, 'Español'), h('option', { value: 'en' }, 'Inglés'));

    function render() {
      const list = docs.filter(d => (lang === 'todos' || d.lang === lang) &&
        (!filter || `${d.title} ${d.description} ${d.category}`.toLowerCase().includes(filter)));
      if (!list.length) return box.replaceChildren(empty('No hay documentos que coincidan', 'Prueba con otra búsqueda.'));
      const cats = [...new Set(list.map(d => d.category))];
      box.replaceChildren(...cats.map(c => h('section', { class: 'lib-cat' },
        h('h2', null, c),
        h('ul', { class: 'lib-list' }, list.filter(d => d.category === c).map(d => h('li', { class: 'lib-item' },
          h('div', { class: 'lib-main' },
            h('a', { href: d.url, target: '_blank', rel: 'noopener noreferrer' }, d.title, icon('external', 14)),
            d.description ? h('p', null, d.description) : null,
            h('span', { class: 'lib-host' }, new URL(d.url).hostname.replace(/^www\./, ''))),
          h('div', { class: 'lib-side' },
            chip(d.lang === 'es' ? 'ES' : 'EN', d.lang === 'es' ? 'accent' : ''),
            teacher ? h('button', { class: 'icon-btn', 'aria-label': `Quitar ${d.title}`, title: 'Quitar de la biblioteca', onclick: async () => {
              if (!await UI.confirm('Quitar documento', `¿Quitar "${d.title}" de la biblioteca? Los alumnos dejarán de verlo.`, 'Quitar', 'danger')) return;
              try { await API.del(`/api/docs/${d.id}`); docs = docs.filter(x => x.id !== d.id); render(); QA.toast('Documento quitado.'); }
              catch (err) { QA.toast(err.message); }
            } }, icon('trash', 16)) : null)))))));
    }

    function addDoc() {
      const err = UI.errorBox();
      const f = {
        title: h('input', { id: 'doc-title', class: 'input', maxlength: '200' }),
        url: h('input', { id: 'doc-url', class: 'input', type: 'url', placeholder: 'https://' }),
        category: h('input', { id: 'doc-cat', class: 'input', value: 'Material del curso', list: 'doc-cats' }),
        description: h('textarea', { id: 'doc-desc', class: 'input', rows: '3', maxlength: '500' }),
        lang: h('select', { id: 'doc-lang', class: 'input' }, h('option', { value: 'es' }, 'Español'), h('option', { value: 'en' }, 'Inglés')),
      };
      const datalist = h('datalist', { id: 'doc-cats' }, [...new Set(docs.map(d => d.category))].map(c => h('option', { value: c })));
      UI.modal('Agregar documento', h('div', { class: 'form' }, err.el,
        UI.field('Título', f.title), UI.field('Enlace', f.url, 'Un PDF, artículo o página con material de estudio.'),
        UI.field('Categoría', f.category), datalist, UI.field('Descripción', f.description), UI.field('Idioma', f.lang)), [
        { label: 'Cancelar', onclick: c => c() },
        { label: 'Agregar', variant: 'primary', onclick: async c => {
          err.clear();
          try {
            const { doc } = await API.post('/api/docs', { title: f.title.value, url: f.url.value, category: f.category.value, description: f.description.value, lang: f.lang.value });
            docs.push(doc); render(); c(); QA.toast('Documento agregado.');
          } catch (e) { err.show(e.message); }
        } },
      ]);
    }

    app.replaceChildren(
      pageHead('Biblioteca', 'Documentación real de QA: el temario oficial, normas, artículos de referencia y herramientas. Los enlaces abren el sitio original.',
        teacher ? btn('Agregar documento', { variant: 'primary', icon: 'plus', onclick: addDoc }) : null),
      h('div', { class: 'toolbar' }, search, langSel),
      box);
    API.get('/api/docs').then(r => { docs = r.docs; render(); }).catch(e => box.replaceChildren(h('p', null, e.message)));
  }

  /* ---------- Glosario ---------- */
  function glossary(app) {
    const list = h('dl', { class: 'gloss' });
    const render = term => {
      const q = term.trim().toLowerCase();
      const items = GLOSSARY.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      list.replaceChildren(...items.map(([t, d]) => h('div', { class: 'gloss-item' }, h('dt', null, t), h('dd', null, d))));
      if (!items.length) list.replaceChildren(empty('Sin resultados', 'Prueba con otro término.'));
    };
    app.replaceChildren(
      pageHead('Glosario', 'Términos clave del glosario ISTQB que aparecen en los juegos y las filminas.',
        btn('Glosario oficial ISTQB', { href: 'https://glossary.istqb.org/', target: '_blank', icon: 'external' })),
      h('div', { class: 'toolbar' }, h('input', { id: 'gloss-search', class: 'input', type: 'search', placeholder: 'Buscar término', oninput: e => render(e.target.value) })),
      list);
    render('');
  }

  /* ---------- Progreso ---------- */
  function progress(app) {
    const s = QA.state;
    const { idx } = QA.levelFor(s.xp);
    app.replaceChildren(
      pageHead('Progreso', `${s.xp} XP acumulados. Tu progreso se guarda en tu cuenta.`),
      h('section', { class: 'panel' },
        h('h2', null, 'Insignias'),
        h('div', { class: 'badges' }, QA.BADGES.map(b => {
          const got = s.badges.includes(b.id);
          return h('div', { class: `badge ${got ? '' : 'locked'}` },
            h('span', { class: 'badge-ico' }, icon(b.icon, 20)),
            h('div', null, h('h4', null, b.name), h('p', null, b.desc)),
            got ? chip('Obtenida', 'ok') : null);
        }))),
      h('div', { class: 'dash two' },
        h('section', { class: 'panel' },
          h('h2', null, 'Niveles'),
          h('ol', { class: 'levels' }, QA.LEVELS.map((l, i) =>
            h('li', { class: i === idx ? 'current' : i < idx ? 'done' : '' }, h('span', null, l.name), h('span', { class: 'num' }, `${l.xp} XP`))))),
        h('section', { class: 'panel' },
          h('h2', null, 'Resultados por juego'),
          h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
            h('thead', null, h('tr', null, h('th', null, 'Juego'), h('th', null, 'Estrellas'), h('th', { class: 'num' }, 'Mejor'), h('th', { class: 'num' }, 'Partidas'))),
            h('tbody', null, QA.games.map(g => {
              const r = s.results[g.id];
              return h('tr', null, h('td', null, h('a', { href: `#/juego/${g.id}` }, g.title)), h('td', null, starsHtml(r ? r.stars : 0)),
                h('td', { class: 'num' }, r ? `${r.best}%` : '—'), h('td', { class: 'num' }, r ? r.plays : 0));
            })))))),
      h('div', { class: 'actions' }, btn('Reiniciar progreso de juegos', { variant: 'danger', icon: 'trash', onclick: async () => {
        if (await UI.confirm('Reiniciar progreso', 'Se borrarán tu XP, estrellas e insignias de los juegos. Los exámenes no se ven afectados.', 'Reiniciar', 'danger')) {
          QA.resetProgress(); progress(app);
        }
      } })));
  }

  /* ---------- Cuenta ---------- */
  function account(app, user) {
    const err = UI.errorBox();
    const cur = h('input', { id: 'pw-current', class: 'input', type: 'password', autocomplete: 'current-password' });
    const nxt = h('input', { id: 'pw-next', class: 'input', type: 'password', autocomplete: 'new-password', minlength: '8' });
    app.replaceChildren(
      pageHead('Mi cuenta'),
      h('div', { class: 'dash two' },
        h('section', { class: 'panel' },
          h('h2', null, 'Datos'),
          h('dl', { class: 'kv' },
            h('dt', null, 'Nombre'), h('dd', null, user.name),
            h('dt', null, 'Email'), h('dd', null, user.email),
            h('dt', null, 'Rol'), h('dd', null, user.role === 'profesor' ? 'Profesor' : 'Alumno'),
            h('dt', null, 'Alta'), h('dd', null, fmtDay(user.createdAt)))),
        h('section', { class: 'panel' },
          h('h2', null, 'Cambiar contraseña'),
          h('form', { class: 'form', onsubmit: async e => {
            e.preventDefault(); err.clear();
            try { await API.put('/api/me/password', { current: cur.value, next: nxt.value }); cur.value = ''; nxt.value = ''; QA.toast('Contraseña actualizada.'); }
            catch (ex) { err.show(ex.message); }
          } }, err.el, UI.field('Contraseña actual', cur), UI.field('Nueva contraseña', nxt, 'Mínimo 8 caracteres.'),
          btn('Guardar contraseña', { variant: 'primary', type: 'submit' })))));
  }

  return { home, games, gameScreen, slidesIndex, slideViewer, library, glossary, progress, account };
})();
