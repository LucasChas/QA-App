/* QA Academy - núcleo: estado, progreso, gamificación y motores de juego reutilizables. */
const QA = (() => {

  const CHAPTERS = [
    { id: 1, title: 'Fundamentos del testing', desc: 'Qué es probar, por qué es necesario, los 7 principios y el proceso de prueba.' },
    { id: 2, title: 'Testing en el ciclo de vida', desc: 'Niveles y tipos de prueba, shift-left, pruebas de confirmación y regresión.' },
    { id: 3, title: 'Pruebas estáticas', desc: 'Revisiones de productos de trabajo y detección temprana de defectos.' },
    { id: 4, title: 'Técnicas de prueba', desc: 'Caja negra, caja blanca y técnicas basadas en la experiencia.' },
    { id: 5, title: 'Gestión de las pruebas', desc: 'Planificación, riesgos, estimación, monitoreo y gestión de defectos.' },
    { id: 6, title: 'Práctica y certificación', desc: 'Pon todo en práctica: pruebas exploratorias y simulacro de examen.' },
  ];

  const LEVELS = [
    { xp: 0, name: 'Aprendiz de Tester' },
    { xp: 150, name: 'Tester Trainee' },
    { xp: 400, name: 'Tester Junior' },
    { xp: 800, name: 'Tester' },
    { xp: 1300, name: 'Tester Senior' },
    { xp: 1900, name: 'Test Analyst' },
    { xp: 2600, name: 'Test Manager' },
    { xp: 3400, name: 'Leyenda ISTQB' },
  ];

  const BADGES = [
    { id: 'primer-paso', icon: 'check', name: 'Primer paso', desc: 'Completa tu primer juego.' },
    { id: 'perfeccionista', icon: 'chart', name: 'Perfeccionista', desc: 'Consigue 3 estrellas en un juego.' },
    { id: 'ojo-halcon', icon: 'search', name: 'Ojo de halcón', desc: '3 estrellas en "Cazador de defectos en requisitos".' },
    { id: 'cazador', icon: 'bug', name: 'Cazabugs', desc: 'Encuentra todos los bugs de la Tienda QA sin falsos positivos.' },
    { id: 'tecnico', icon: 'compass', name: 'Maestro de técnicas', desc: '3 estrellas en todos los juegos del capítulo 4.' },
    { id: 'explorador', icon: 'grid', name: 'Explorador', desc: 'Juega todos los juegos al menos una vez.' },
    { id: 'certificado', icon: 'graduation', name: 'Listo para certificar', desc: 'Aprueba el simulacro de examen (≥ 65%).' },
    { id: 'leyenda', icon: 'layers', name: 'Leyenda', desc: '3 estrellas en todos los juegos.' },
    { id: 'oficial', icon: 'clipboard', name: 'Examen superado', desc: 'Aprueba un simulacro oficial de 40 preguntas.' },
    { id: 'constancia', icon: 'calendar', name: 'Constancia', desc: 'Cumple la meta diaria 7 días seguidos.' },
    { id: 'memoria', icon: 'cycle', name: 'Memoria de tester', desc: 'Domina 10 preguntas en el repaso espaciado.' },
  ];

  /* Sección principal del temario que trabaja cada juego (para las estadísticas por tema). */
  const GAME_SEC = {
    'error-defecto-fallo': '1.2', 'siete-principios': '1.3', 'proceso-pruebas': '1.4', 'por-que-probar': '1.1',
    'niveles-prueba': '2.2', 'tipos-prueba': '2.2', 'sdlc-shift-left': '2.1',
    'revision-requisitos': '3.1', 'tipos-revision': '3.2',
    'particiones-limites': '4.2', 'tabla-decision': '4.2', 'transicion-estados': '4.2', 'elige-tecnica': '4.3',
    'reporte-defectos': '5.5', 'riesgos': '5.2', 'gestion-pruebas': '5.1', 'bug-hunt': '4.4',
  };

  const games = [];

  /* ---------------- Estado ----------------
     El progreso vive en el servidor (cuenta del usuario). Aquí se mantiene una copia
     en memoria y cada cambio se envía con un pequeño retardo. */
  const defaultState = () => ({
    xp: 0, results: {}, badges: [],
    topics: {},                       // { '4.2': { seen, correct } }
    review: [],                       // cola de repaso espaciado (Leitner)
    mastered: 0,
    daily: { date: '', count: 0 },
    streak: { count: 0, last: '' },
    mocks: [],                        // historial de simulacros oficiales
  });

  let state = defaultState();
  let syncTimer = null;

  function loadState(progress) {
    const base = defaultState();
    if (progress) for (const k of Object.keys(base)) if (progress[k] !== undefined) base[k] = progress[k];
    state = base;
    renderPlayer();
  }

  function save() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      API.put('/api/progress', state).catch(() => toast('No se pudo guardar tu progreso. Revisa tu conexión.'));
    }, 300);
  }

  function resetProgress() {
    state = defaultState();
    save();
    renderPlayer();
  }

  function levelFor(xp) {
    let idx = 0;
    LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i; });
    const cur = LEVELS[idx];
    const next = LEVELS[idx + 1];
    const pct = next ? ((xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100;
    return { idx, cur, next, pct };
  }

  function starsFor(pct) {
    if (pct >= 90) return 3;
    if (pct >= 70) return 2;
    if (pct >= 50) return 1;
    return 0;
  }

  /* ---------------- Aprendizaje: temas, repaso espaciado y racha ---------------- */
  const LEITNER_DAYS = [0, 1, 2, 4, 8, 16]; // días hasta el próximo repaso según la caja (1 a 5)
  const DAILY_GOAL = 10;                    // preguntas respondidas por día
  const MAX_REVIEW = 250;
  const DAY = 864e5;
  let context = null;                       // { gameId, sec } del juego en curso

  const pad = n => String(n).padStart(2, '0');
  const dayStr = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const stripHtml = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.trim(); };

  function keyOf(it) {
    const s = `${it.q}|${it.answer}`;
    let hsh = 5381;
    for (let i = 0; i < s.length; i++) hsh = ((hsh << 5) + hsh + s.charCodeAt(i)) | 0;
    return 'q' + (hsh >>> 0).toString(36);
  }

  function setContext(c) { context = c; }

  function trackTopic(sec, ok) {
    if (!sec) return;
    const t = state.topics[sec] || (state.topics[sec] = { seen: 0, correct: 0 });
    t.seen++;
    if (ok) t.correct++;
  }

  function trackDaily() {
    const d = dayStr(Date.now());
    if (state.daily.date !== d) state.daily = { date: d, count: 0 };
    state.daily.count++;
    if (state.daily.count === DAILY_GOAL && state.streak.last !== d) {
      const yesterday = dayStr(Date.now() - DAY);
      state.streak = { count: state.streak.last === yesterday ? state.streak.count + 1 : 1, last: d };
      toast(`Meta diaria cumplida. Racha: ${state.streak.count} ${state.streak.count === 1 ? 'día' : 'días'}.`);
      if (state.streak.count >= 7) unlock('constancia');
    }
  }

  function addMistake(it, sec, src) {
    if (it.context && typeof it.context !== 'string') return; // depende de un diagrama: no se repasa fuera del juego
    const key = it.key || keyOf(it);
    const existing = state.review.find(r => r.key === key);
    if (existing) { existing.box = 1; existing.due = Date.now(); return; }
    state.review.push({
      key, q: it.q, context: it.context || '', options: it.options.slice(), answer: it.answer,
      explain: it.explain || '', sec: sec || '', src: src || '', box: 1, due: Date.now(),
    });
    if (state.review.length > MAX_REVIEW) state.review.splice(0, state.review.length - MAX_REVIEW);
  }

  function reviewMove(key, ok) {
    const r = state.review.find(x => x.key === key);
    if (!r) return;
    if (!ok) { r.box = 1; r.due = startOfDay(Date.now()) + DAY; return; }
    if (r.box >= 5) {
      state.review = state.review.filter(x => x !== r);
      state.mastered++;
      if (state.mastered >= 10) unlock('memoria');
      return;
    }
    r.box++;
    r.due = startOfDay(Date.now()) + LEITNER_DAYS[r.box] * DAY;
  }

  /** Registra cualquier respuesta: estadística por tema, meta diaria y cola de repaso. */
  function recordAnswer(it, ok, opts = {}) {
    const sec = it.sec || (context && context.sec) || null;
    trackTopic(sec, ok);
    trackDaily();
    if (opts.review) reviewMove(it.key, ok);
    else if (!ok) addMistake(it, sec, opts.src || (context && context.gameId) || '');
    save();
  }

  const reviewDue = () => state.review.filter(r => r.due <= Date.now()).sort((a, b) => a.box - b.box || a.due - b.due);

  /* ---------------- Utilidades DOM ---------------- */
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function starsHtml(n) {
    return h('span', { class: 'stars', title: `${n} de 3 estrellas` },
      [0, 1, 2].map(i => h('span', { class: i < n ? '' : 'off' }, '★')));
  }

  function toast(msg) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = h('div', { class: 'toast' }, msg);
    box.append(t);
    setTimeout(() => t.remove(), 4000);
  }

  function renderPlayer() {
    const el = document.getElementById('player');
    if (!el) return;
    const { cur, next, pct } = levelFor(state.xp);
    el.replaceChildren(
      h('span', { class: 'player-level' }, cur.name),
      h('div', { class: 'player-xp' },
        h('div', { class: 'bar' }, h('span', { style: `width:${pct}%` })),
        h('small', null, next ? `${state.xp} / ${next.xp} XP` : `${state.xp} XP · nivel máximo`)
      )
    );
  }

  /* ---------------- Juegos y progreso ---------------- */
  function registerGame(game) { games.push(game); }

  function getResult(id) { return state.results[id] || null; }

  function unlock(id) {
    if (state.badges.includes(id)) return null;
    state.badges.push(id);
    const b = BADGES.find(x => x.id === id);
    toast(`Insignia desbloqueada: ${b.name}`);
    return b;
  }

  function checkBadges(gameId, pct, extra) {
    const unlocked = [];
    const push = b => { if (b) unlocked.push(b); };
    const allStars = list => list.length > 0 && list.every(g => (state.results[g.id] || {}).stars === 3);
    push(unlock('primer-paso'));
    if (starsFor(pct) === 3) push(unlock('perfeccionista'));
    if (gameId === 'revision-requisitos' && starsFor(pct) === 3) push(unlock('ojo-halcon'));
    if (extra && extra.allBugs) push(unlock('cazador'));
    if (gameId === 'examen' && pct >= 65) push(unlock('certificado'));
    if (allStars(games.filter(g => g.chapter === 4))) push(unlock('tecnico'));
    if (games.every(g => state.results[g.id])) push(unlock('explorador'));
    if (allStars(games)) push(unlock('leyenda'));
    return unlocked;
  }

  function recordResult(game, score, max, extra) {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    const prev = state.results[game.id] || { best: 0, plays: 0, stars: 0 };
    const earnedXp = Math.round(game.xp * pct / 100);
    const prevXp = Math.round(game.xp * prev.best / 100);
    const gained = Math.max(0, earnedXp - prevXp) + 10; // +10 XP por practicar
    const before = levelFor(state.xp).idx;
    state.xp += gained;
    const best = Math.max(prev.best, pct);
    state.results[game.id] = { best, plays: prev.plays + 1, stars: starsFor(best), last: pct };
    const badges = checkBadges(game.id, pct, extra);
    const after = levelFor(state.xp);
    save();
    renderPlayer();
    if (after.idx > before) toast(`Subiste de nivel: ${after.cur.name}`);
    return { pct, gained, stars: starsFor(pct), badges, newBest: pct > prev.best };
  }

  /* Pantalla de resultados común */
  function showResult(root, game, score, max, extra) {
    const r = recordResult(game, score, max, extra);
    const msgs = [
      'Sigue practicando: repasa la teoría y vuelve a intentarlo.',
      '¡Buen comienzo! Ya tienes las bases.',
      '¡Muy bien! Estás cerca de dominarlo.',
      '¡Excelente! Dominas este tema.',
    ];
    root.replaceChildren(
      h('div', { class: 'card result' },
        h('div', { class: 'big-stars' }, starsHtml(r.stars)),
        h('div', { class: 'score' }, `${score} / ${max} (${r.pct}%)`),
        h('p', null, msgs[r.stars]),
        extra && extra.note ? h('p', { class: 'muted' }, extra.note) : null,
        h('p', { class: 'xp' }, `+${r.gained} XP${r.newBest ? ' · ¡Nuevo récord!' : ''}`),
        r.badges.length ? h('p', null, 'Insignias nuevas: ', r.badges.map(b => b.name).join(', ')) : null,
        h('div', { class: 'actions' },
          h('a', { class: 'btn', href: '#/juegos' }, 'Volver a los juegos'),
          h('button', { class: 'btn primary', onclick: () => window.dispatchEvent(new Event('hashchange')) }, 'Jugar de nuevo')
        )
      )
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Motores de juego ---------------- */

  function progressLine(i, total, extra) {
    return h('div', { class: 'progress-line' },
      h('span', null, `${i + 1} / ${total}`),
      h('div', { class: 'bar' }, h('span', { style: `width:${(i / total) * 100}%` })),
      extra || null
    );
  }

  function feedback(ok, title, explain) {
    return h('div', { class: `feedback ${ok === null ? 'info' : ok ? 'ok' : 'bad'}` },
      h('b', null, title),
      explain ? h('div', { html: explain }) : null
    );
  }

  /**
   * Quiz de opción única.
   * items: [{ q, context?, options: [string], answer: string, explain?, cols?, keepOrder? }]
   * opts: { limit?, shuffle? (default true), keepOrder? / forceShuffle? (opciones), timer? (segundos) }
   */
  function quiz(root, opts, onDone) {
    let items = opts.shuffle === false ? opts.items.slice() : shuffle(opts.items);
    if (opts.limit) items = items.slice(0, opts.limit);
    let i = 0;
    let score = 0;
    let timerId = null;
    let remaining = opts.timer || 0;
    let finished = false;
    const timerEl = opts.timer ? h('span', { class: 'timer' }) : null;

    function done() {
      if (finished) return;
      finished = true;
      if (timerId) clearInterval(timerId);
      onDone(score, items.length);
    }

    function tick() {
      if (!document.body.contains(root)) { clearInterval(timerId); return; }
      remaining--;
      updateTimer();
      if (remaining <= 0) {
        toast('Se acabó el tiempo.');
        done();
      }
    }

    function updateTimer() {
      if (!timerEl) return;
      const m = Math.floor(remaining / 60);
      const s = String(remaining % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
      timerEl.classList.toggle('low', remaining <= 60);
    }

    function show() {
      const it = items[i];
      // Se mezclan las opciones salvo en listas de categorías fijas o respuestas numéricas.
      const numeric = it.options.every(o => /^[\d$%.,\s-]+(días|reglas)?$/.test(o));
      const keep = !opts.forceShuffle && (it.keepOrder || opts.keepOrder || numeric);
      const options = keep ? it.options : shuffle(it.options);
      const optBox = h('div', { class: `options ${it.cols === 1 ? '' : options.length > 3 || it.cols === 2 ? 'cols-2' : ''}` });
      const actions = h('div', { class: 'actions' });
      const fbBox = h('div');
      options.forEach(o => {
        const b = h('button', {
          class: 'option',
          onclick: () => {
            const ok = o === it.answer;
            if (ok) score++;
            if (opts.track !== false) recordAnswer(it, ok, { review: opts.review, src: opts.src });
            optBox.querySelectorAll('.option').forEach(x => {
              x.disabled = true;
              if (x.dataset.val === it.answer) x.classList.add('correct');
            });
            if (!ok) b.classList.add('wrong');
            fbBox.append(feedback(ok, ok ? 'Correcto' : `Incorrecto. La respuesta es: ${it.answer}`, it.explain));
            if (!ok && opts.track !== false && !opts.review && !(it.context && typeof it.context !== 'string')) {
              fbBox.append(h('p', { class: 'muted small' }, 'Agregada a tu repaso espaciado.'));
            }
            fbBox.append(h('button', { class: 'link-btn small', onclick: () => typeof UI !== 'undefined' && UI.reportQuestion({
              source: opts.src || (context && context.gameId) || 'quiz', key: it.key || keyOf(it), text: stripHtml(it.q),
            }) }, 'Reportar un problema con esta pregunta'));
            const last = i === items.length - 1;
            actions.append(h('button', {
              class: 'btn primary',
              onclick: () => { if (last) done(); else { i++; show(); } },
            }, last ? 'Ver resultado' : 'Siguiente →'));
          },
        }, o);
        b.dataset.val = o;
        optBox.append(b);
      });
      root.replaceChildren(
        h('div', { class: 'card' },
          progressLine(i, items.length, timerEl),
          it.context ? (it.context instanceof Node ? it.context : h('div', { class: 'context', html: it.context })) : null,
          h('div', { class: 'question', html: it.q }),
          optBox,
          fbBox,
          actions
        )
      );
    }

    if (opts.timer) {
      updateTimer();
      timerId = setInterval(tick, 1000);
    }
    show();
  }

  /**
   * Ordenar elementos haciendo clic.
   * cfg: { title, instructions, items: [string] (orden correcto), explain? }
   */
  function order(root, cfg, onDone) {
    const pool = shuffle(cfg.items.map((t, idx) => ({ t, idx })));
    let placed = [];
    let checked = false;

    function render() {
      const placedZone = h('div', { class: 'order-zone' },
        placed.length ? null : h('span', { class: 'muted' }, 'Haz clic en los elementos de abajo en el orden correcto…'),
        placed.map((p, pos) => {
          const cls = checked ? (p.idx === pos ? 'correct' : 'wrong') : '';
          return h('button', {
            class: `chip ${cls}`,
            disabled: checked,
            onclick: () => { placed = placed.filter(x => x !== p); render(); },
          }, h('span', { class: 'num' }, pos + 1), p.t);
        })
      );
      const remainingItems = pool.filter(p => !placed.includes(p));
      const poolZone = h('div', { class: 'order-zone pool' },
        remainingItems.length ? null : h('span', { class: 'muted' }, '¡Listo! Comprueba tu respuesta.'),
        remainingItems.map(p => h('button', { class: 'chip', onclick: () => { placed.push(p); render(); } }, p.t))
      );
      const correct = placed.filter((p, pos) => p.idx === pos).length;
      const actions = h('div', { class: 'actions' });
      if (!checked) {
        actions.append(
          h('button', { class: 'btn', onclick: () => { placed = []; render(); } }, 'Reiniciar'),
          h('button', {
            class: 'btn primary',
            disabled: remainingItems.length > 0,
            onclick: () => { checked = true; render(); },
          }, 'Comprobar')
        );
      } else {
        actions.append(h('button', { class: 'btn primary', onclick: () => onDone(correct, cfg.items.length) }, 'Continuar →'));
      }
      root.replaceChildren(
        h('div', { class: 'card' },
          h('div', { class: 'question' }, cfg.title),
          cfg.instructions ? h('p', { class: 'muted' }, cfg.instructions) : null,
          cfg.context ? h('div', { class: 'context', html: cfg.context }) : null,
          h('b', null, 'Tu orden:'),
          placedZone,
          checked ? null : h('b', null, 'Elementos disponibles:'),
          checked ? null : poolZone,
          checked ? feedback(correct === cfg.items.length, `${correct} de ${cfg.items.length} en la posición correcta`,
            `<b>Orden correcto:</b> ${cfg.items.map((t, k) => `${k + 1}. ${t}`).join(' → ')}${cfg.explain ? `<br><br>${cfg.explain}` : ''}`) : null,
          actions
        )
      );
    }
    render();
  }

  /**
   * Selección múltiple por rondas.
   * rounds: [{ q, context?, options: [string], correct: [string], explain? }]
   * Puntaje por ronda: aciertos - falsos positivos (mínimo 0), máximo = correctas.
   */
  function multiSelect(root, rounds, onDone) {
    let i = 0;
    let score = 0;
    let max = 0;

    function show() {
      const r = rounds[i];
      const selected = new Set();
      const optBox = h('div', { class: 'row' });
      const fbBox = h('div');
      const actions = h('div', { class: 'actions' });
      r.options.forEach(o => {
        const b = h('button', {
          class: 'chip',
          onclick: () => {
            if (selected.has(o)) selected.delete(o); else selected.add(o);
            b.classList.toggle('selected', selected.has(o));
          },
        }, o);
        b.dataset.val = o;
        optBox.append(b);
      });
      const check = h('button', {
        class: 'btn primary',
        onclick: () => {
          let hits = 0;
          let fp = 0;
          optBox.querySelectorAll('.chip').forEach(b => {
            const v = b.dataset.val;
            const isCorrect = r.correct.includes(v);
            b.disabled = true;
            b.classList.remove('selected');
            if (isCorrect && selected.has(v)) { hits++; b.classList.add('correct'); }
            else if (isCorrect) { b.classList.add('wrong'); b.textContent = `${v} (faltó)`; }
            else if (selected.has(v)) { fp++; b.classList.add('wrong'); }
          });
          const pts = Math.max(0, hits - fp);
          score += pts;
          max += r.correct.length;
          const perfect = pts === r.correct.length;
          fbBox.append(feedback(perfect, `${pts} / ${r.correct.length} puntos (aciertos: ${hits}, sobrantes: ${fp})`,
            `<b>Respuesta:</b> ${r.correct.join(', ')}${r.explain ? `<br>${r.explain}` : ''}`));
          check.remove();
          const last = i === rounds.length - 1;
          actions.append(h('button', {
            class: 'btn primary',
            onclick: () => { if (last) onDone(score, max); else { i++; show(); } },
          }, last ? 'Ver resultado' : 'Siguiente →'));
        },
      }, 'Comprobar');
      actions.append(check);
      root.replaceChildren(
        h('div', { class: 'card' },
          progressLine(i, rounds.length),
          r.context ? h('div', { class: 'context', html: r.context }) : null,
          h('div', { class: 'question', html: r.q }),
          h('p', { class: 'muted' }, 'Selecciona todas las opciones que correspondan.'),
          optBox,
          fbBox,
          actions
        )
      );
    }
    show();
  }

  /** Encadena varias fases (cada una es fn(root, onDone)) y suma sus puntajes. */
  function phases(root, list, onDone) {
    let total = 0;
    let max = 0;
    let k = 0;
    const next = () => {
      if (k >= list.length) return onDone(total, max);
      const run = list[k++];
      run(root, (s, m) => { total += s; max += m; next(); });
    };
    next();
  }

  return {
    CHAPTERS, LEVELS, BADGES, games,
    get state() { return state; },
    h, shuffle, starsHtml, toast, renderPlayer, levelFor, resetProgress, loadState, save, unlock,
    setContext, recordAnswer, addMistake, reviewDue, keyOf, stripHtml, dayStr, GAME_SEC, LEITNER_DAYS, DAILY_GOAL,
    registerGame, getResult, showResult,
    quiz, order, multiSelect, phases, feedback,
  };
})();
