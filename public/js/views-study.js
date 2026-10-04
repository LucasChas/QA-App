/* Estudio: repaso espaciado, simulacro oficial CTFL, práctica de temas débiles y preparación. */
const StudyViews = (() => {
  const { h } = QA;
  const { pageHead, btn, chip, icon, empty, fmtDate, meter } = UI;

  const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);
  const PASS_SCORE = 26;
  const EXAM_SIZE = 40;

  /* ---------- Cálculos de preparación ---------- */
  function chapterAccuracy() {
    const out = {};
    for (const [sec, t] of Object.entries(QA.state.topics)) {
      const ch = sec[0];
      const o = out[ch] || (out[ch] = { seen: 0, correct: 0 });
      o.seen += t.seen;
      o.correct += t.correct;
    }
    return out;
  }

  /** Puntaje estimado sobre 40 ponderando la precisión de cada capítulo por su peso en el examen. */
  function estimate() {
    const acc = chapterAccuracy();
    const missing = Object.keys(QA.EXAM_QUOTA).filter(ch => !acc[ch] || acc[ch].seen < 3);
    const total = Object.values(acc).reduce((s, a) => s + a.seen, 0);
    if (missing.length || total < 30) return { ready: false, missing, total };
    const score = Object.entries(QA.EXAM_QUOTA).reduce((s, [ch, q]) => s + q * (acc[ch].correct / acc[ch].seen), 0);
    return { ready: true, score: Math.round(score), total };
  }

  function weakTopics(n = 3) {
    const bankSecs = [...new Set(QA.questionBank.map(q => q.sec))];
    const seen = bankSecs.filter(s => (QA.state.topics[s] || {}).seen >= 3)
      .map(s => ({ sec: s, acc: QA.state.topics[s].correct / QA.state.topics[s].seen }))
      .sort((a, b) => a.acc - b.acc);
    const weak = seen.filter(x => x.acc < 0.8).map(x => x.sec);
    const unseen = bankSecs.filter(s => !((QA.state.topics[s] || {}).seen >= 3)).sort();
    return weak.concat(unseen).slice(0, n);
  }

  /* ---------- Repaso espaciado ---------- */
  function review(app) {
    const due = QA.reviewDue();
    const all = QA.state.review;
    const boxes = [1, 2, 3, 4, 5].map(b => all.filter(r => r.box === b).length);
    const daily = QA.state.daily.date === QA.dayStr(Date.now()) ? QA.state.daily.count : 0;
    const next = all.filter(r => r.due > Date.now()).sort((a, b) => a.due - b.due)[0];

    app.replaceChildren(
      pageHead('Repaso', 'Las preguntas que fallas en juegos, simulacros y exámenes vuelven aquí. Cada acierto la pasa a la caja siguiente y la aleja en el tiempo; un error la devuelve a la caja 1.'),
      h('div', { class: 'stats' },
        stat('Para hoy', due.length),
        stat('En la cola', all.length),
        stat('Dominadas', QA.state.mastered),
        stat('Racha', `${QA.state.streak.count} ${QA.state.streak.count === 1 ? 'día' : 'días'}`)),
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', null, 'Meta diaria'), h('span', { class: 'muted small' }, `${Math.min(daily, QA.DAILY_GOAL)} de ${QA.DAILY_GOAL} preguntas`)),
        meter((Math.min(daily, QA.DAILY_GOAL) / QA.DAILY_GOAL) * 100, daily >= QA.DAILY_GOAL ? 'ok' : ''),
        h('p', { class: 'muted small' }, 'Cuenta cualquier pregunta que respondas en la plataforma. Cumplirla varios días seguidos mantiene tu racha.')),
      h('section', { class: 'panel' },
        h('h2', null, 'Cajas'),
        h('ol', { class: 'boxes' }, boxes.map((n, i) => h('li', null,
          h('span', { class: 'box-n' }, n),
          h('span', { class: 'box-l' }, `Caja ${i + 1}`),
          h('span', { class: 'muted small' }, i === 0 ? 'cada día' : `cada ${QA.LEITNER_DAYS[i + 1]} días`)))),
        due.length
          ? btn(`Repasar ${Math.min(due.length, 20)} ${Math.min(due.length, 20) === 1 ? 'pregunta' : 'preguntas'}`, { variant: 'primary', icon: 'cycle', onclick: () => session(app, due.slice(0, 20)) })
          : h('p', { class: 'muted' }, all.length
            ? `No tienes preguntas pendientes hoy. La próxima vuelve el ${new Date(next.due).toLocaleDateString('es', { dateStyle: 'medium' })}.`
            : 'Tu cola está vacía. Juega o rinde un simulacro: las preguntas que falles aparecerán aquí.')));
  }

  function session(app, items) {
    const root = h('div', { class: 'play' });
    app.replaceChildren(h('a', { class: 'back', href: '#/repaso' }, icon('left', 16), 'Repaso'), pageHead('Sesión de repaso'), root);
    QA.setContext(null);
    QA.quiz(root, { items: items.map(r => ({ ...r })), review: true, src: 'repaso', cols: 1 }, (score, max) => {
      root.replaceChildren(h('div', { class: 'card result' },
        h('div', { class: 'score' }, `${score} / ${max}`),
        h('p', null, score === max ? 'Todas correctas: esas preguntas pasan a la caja siguiente.' : 'Las que fallaste vuelven mañana a la caja 1.'),
        h('div', { class: 'actions' }, btn('Volver al repaso', { variant: 'primary', href: '#/repaso' }))));
    });
  }

  /* ---------- Simulacro oficial ---------- */
  const MOCK_KEY = 'qa-mock-session';
  const loadMock = () => { try { return JSON.parse(sessionStorage.getItem(MOCK_KEY)); } catch (e) { return null; } };
  const saveMock = m => { try { sessionStorage.setItem(MOCK_KEY, JSON.stringify(m)); } catch (e) { /* sin almacenamiento */ } };
  const dropMock = () => { try { sessionStorage.removeItem(MOCK_KEY); } catch (e) { /* sin almacenamiento */ } };

  function drawMock() {
    const qs = [];
    for (const [ch, n] of Object.entries(QA.EXAM_QUOTA)) {
      QA.shuffle(QA.questionBank.filter(q => String(q.ch) === ch)).slice(0, n)
        .forEach(q => qs.push({ ...q, options: QA.shuffle(q.options) }));
    }
    return qs;
  }

  function mock(app) {
    const live = loadMock();
    if (live && live.deadline > Date.now()) return mockTake(app, live);
    if (live) { dropMock(); return mockFinish(app, live, true); }

    const extra = h('input', { type: 'checkbox', id: 'mock-extra' });
    const hist = QA.state.mocks.slice().reverse();
    app.replaceChildren(
      pageHead('Simulacro oficial CTFL', 'Mismo formato que el examen real de ISTQB Foundation Level v4.0.'),
      h('div', { class: 'dash' },
        h('section', { class: 'panel' },
          h('ul', { class: 'facts' },
            h('li', null, h('span', null, 'Preguntas'), h('strong', null, EXAM_SIZE)),
            h('li', null, h('span', null, 'Tiempo'), h('strong', null, '60 min')),
            h('li', null, h('span', null, 'Para aprobar'), h('strong', null, `${PASS_SCORE} correctas (65%)`))),
          h('p', { class: 'muted' }, 'Las preguntas se sortean del banco respetando cuántas trae el examen real de cada capítulo. Puedes marcar preguntas para revisarlas antes de entregar. Al terminar verás tu resultado por capítulo y las explicaciones; las que falles pasan a tu repaso.'),
          h('label', { class: 'check', for: 'mock-extra' }, extra, h('span', null, 'Rindo en un idioma que no es mi lengua materna (+25%: 75 minutos), como permite ISTQB.')),
          btn('Comenzar simulacro', { variant: 'primary', onclick: () => {
            const minutes = extra.checked ? 75 : 60;
            const m = { questions: drawMock(), answers: {}, flags: [], minutes, started: Date.now(), deadline: Date.now() + minutes * 60000 };
            saveMock(m);
            mockTake(app, m);
          } })),
        h('section', { class: 'panel' },
          h('h2', null, 'Preguntas por capítulo'),
          h('table', { class: 'data' },
            h('tbody', null, Object.entries(QA.EXAM_QUOTA).map(([ch, n]) => h('tr', null,
              h('td', null, `Cap. ${ch} · ${(QA.CHAPTERS.find(c => c.id === Number(ch)) || {}).title || 'Herramientas de prueba'}`),
              h('td', { class: 'num' }, n))))))),
      h('section', { class: 'panel' },
        h('h2', null, 'Tus simulacros'),
        hist.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
          h('thead', null, h('tr', null, h('th', null, 'Fecha'), h('th', { class: 'num' }, 'Correctas'), h('th', null, 'Resultado'), h('th', { class: 'num' }, 'Tiempo'))),
          h('tbody', null, hist.map(m => h('tr', null,
            h('td', null, fmtDate(m.date)), h('td', { class: 'num' }, `${m.score}/${m.max}`),
            h('td', null, chip(m.passed ? 'Aprobado' : 'No aprobado', m.passed ? 'ok' : 'bad')),
            h('td', { class: 'num' }, `${m.minutes} min`)))))) :
          h('p', { class: 'muted' }, 'Todavía no rendiste ningún simulacro oficial.')));
  }

  function mockTake(app, m) {
    const timer = h('span', { class: 'timer' });
    const status = h('span', { class: 'muted small' });
    const nav = h('div', { class: 'q-nav' });
    let timerId = null;
    let finished = false;

    const update = () => {
      const answered = Object.keys(m.answers).length;
      status.textContent = `${answered} de ${m.questions.length} respondidas · ${m.flags.length} marcadas`;
      nav.querySelectorAll('a').forEach((a, k) => {
        a.classList.toggle('done', k in m.answers || String(k) in m.answers);
        a.classList.toggle('flag', m.flags.includes(k));
      });
      saveMock(m);
    };

    const finish = auto => {
      if (finished) return;
      finished = true;
      clearInterval(timerId);
      dropMock();
      if (auto) QA.toast('Se terminó el tiempo: el simulacro se entregó automáticamente.');
      mockFinish(app, m, false);
    };

    const cards = m.questions.map((q, k) => {
      const flag = h('button', { class: 'link-btn small', type: 'button', onclick: () => {
        m.flags = m.flags.includes(k) ? m.flags.filter(x => x !== k) : m.flags.concat(k);
        flag.textContent = m.flags.includes(k) ? 'Quitar marca' : 'Marcar para revisar';
        card.classList.toggle('flagged', m.flags.includes(k));
        update();
      } }, m.flags.includes(k) ? 'Quitar marca' : 'Marcar para revisar');
      const card = h('fieldset', { class: `q-card ${m.flags.includes(k) ? 'flagged' : ''}`, id: `q-${k + 1}` },
        h('legend', null,
          h('span', { class: 'q-num' }, `Pregunta ${k + 1} · Cap. ${q.ch} · K${q.k}`),
          h('span', { class: 'q-text', html: q.q })),
        h('div', { class: 'q-options' }, q.options.map((o, idx) => {
          const input = h('input', { type: 'radio', name: `mq-${k}`, id: `mq-${k}-${idx}`, onchange: () => { m.answers[k] = idx; update(); } });
          if (m.answers[k] === idx) input.checked = true;
          return h('label', { class: 'q-option', for: `mq-${k}-${idx}` }, input, h('span', null, o));
        })),
        flag);
      return card;
    });
    m.questions.forEach((q, k) => nav.append(h('a', { href: `#q-${k + 1}`, onclick: e => {
      e.preventDefault(); document.getElementById(`q-${k + 1}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } }, k + 1)));

    async function askSubmit() {
      const missing = m.questions.length - Object.keys(m.answers).length;
      const parts = [];
      if (missing) parts.push(`${missing} sin responder`);
      if (m.flags.length) parts.push(`${m.flags.length} marcadas para revisar`);
      const msg = parts.length ? `Tienes ${parts.join(' y ')}. ¿Entregar de todas formas?` : 'Una vez entregado verás tu resultado y las explicaciones.';
      if (await UI.confirm('Entregar simulacro', msg, 'Entregar')) finish(false);
    }

    function tick() {
      if (!document.body.contains(timer)) { clearInterval(timerId); return; }
      const left = Math.max(0, Math.round((m.deadline - Date.now()) / 1000));
      timer.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      timer.classList.toggle('low', left <= 300);
      if (left <= 0) finish(true);
    }

    app.replaceChildren(
      h('div', { class: 'exam-bar' },
        h('div', null, h('strong', null, 'Simulacro oficial CTFL'), status),
        h('span', { class: 'spacer' }),
        h('span', { class: 'timer-wrap' }, icon('clock', 16), timer),
        btn('Entregar', { variant: 'primary', onclick: askSubmit })),
      nav,
      h('div', { class: 'q-list' }, cards),
      h('div', { class: 'actions' }, btn('Entregar simulacro', { variant: 'primary', onclick: askSubmit })));
    update();
    tick();
    timerId = setInterval(tick, 1000);
  }

  function mockFinish(app, m, expired) {
    let score = 0;
    const byCh = {};
    m.questions.forEach((q, k) => {
      const chosen = m.answers[k];
      const ok = chosen !== undefined && q.options[chosen] === q.answer;
      if (ok) score++;
      const c = byCh[q.ch] || (byCh[q.ch] = [0, 0]);
      c[1]++;
      if (ok) c[0]++;
      QA.recordAnswer(q, ok, { src: 'simulacro' });
    });
    const passed = score >= PASS_SCORE;
    QA.state.mocks.push({ date: new Date().toISOString(), score, max: m.questions.length, pct: pct(score, m.questions.length), passed, minutes: m.minutes, byCh });
    if (QA.state.mocks.length > 30) QA.state.mocks.shift();
    QA.state.xp += score * 3;
    if (passed) { QA.unlock('oficial'); QA.unlock('certificado'); }
    QA.save();
    QA.renderPlayer();

    app.replaceChildren(
      h('a', { class: 'back', href: '#/simulacro' }, icon('left', 16), 'Simulacro oficial'),
      pageHead('Resultado del simulacro', expired ? 'El tiempo se agotó mientras estabas fuera: se calificó con las respuestas guardadas.' : null,
        btn('Ver mi preparación', { href: '#/progreso', icon: 'chart' })),
      h('section', { class: `panel result-panel ${passed ? 'pass' : 'fail'}` },
        h('div', { class: 'result-score' }, h('strong', null, `${score}/${m.questions.length}`), h('span', null, `${pct(score, m.questions.length)}% · +${score * 3} XP`)),
        h('div', { class: 'result-verdict' },
          chip(passed ? 'Aprobado' : 'No aprobado', passed ? 'ok' : 'bad'),
          h('span', { class: 'muted small' }, passed ? `Superaste las ${PASS_SCORE} correctas necesarias.` : `Te faltaron ${PASS_SCORE - score} para llegar a ${PASS_SCORE}.`)),
        meter(pct(score, m.questions.length), passed ? 'ok' : 'bad')),
      h('section', { class: 'panel' },
        h('h2', null, 'Resultado por capítulo'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
          h('thead', null, h('tr', null, h('th', null, 'Capítulo'), h('th', { class: 'num' }, 'Correctas'), h('th', null, ''))),
          h('tbody', null, Object.entries(byCh).map(([ch, [c, t]]) => h('tr', null,
            h('td', null, `Cap. ${ch}`), h('td', { class: 'num' }, `${c}/${t}`),
            h('td', { class: 'meter-cell' }, meter(pct(c, t), pct(c, t) >= 65 ? 'ok' : pct(c, t) >= 50 ? 'warn' : 'bad')))))))),
      h('section', { class: 'review' },
        h('h2', null, 'Revisión'),
        m.questions.map((q, k) => {
          const chosen = m.answers[k];
          const correctIdx = q.options.indexOf(q.answer);
          const ok = chosen === correctIdx;
          return h('article', { class: `rv ${ok ? 'ok' : 'bad'}` },
            h('div', { class: 'rv-head' },
              h('span', { class: 'q-num' }, `Pregunta ${k + 1} · ${q.sec} ${QA.TOPICS[q.sec]} · ${QA.K_LABEL[q.k]}`),
              chip(ok ? 'Correcta' : chosen === undefined ? 'Sin responder' : 'Incorrecta', ok ? 'ok' : 'bad')),
            h('p', { class: 'q-text', html: q.q }),
            h('ul', { class: 'rv-options' }, q.options.map((o, idx) => h('li', {
              class: [idx === correctIdx ? 'is-answer' : '', idx === chosen && !ok ? 'is-wrong' : ''].join(' ').trim(),
            }, o, idx === correctIdx ? h('span', { class: 'tag-s' }, 'Correcta') : idx === chosen ? h('span', { class: 'tag-s' }, 'Tu respuesta') : null))),
            q.explain ? h('p', { class: 'rv-explain' }, q.explain) : null,
            h('button', { class: 'link-btn small', onclick: () => UI.reportQuestion({ source: 'simulacro', key: QA.keyOf(q), text: QA.stripHtml(q.q) }) }, 'Reportar un problema con esta pregunta'));
        })));
    window.scrollTo(0, 0);
  }

  /* ---------- Práctica de temas débiles ---------- */
  function weakPractice(app) {
    const secs = weakTopics(3);
    const pool = QA.shuffle(QA.questionBank.filter(q => secs.includes(q.sec))).slice(0, 10);
    const root = h('div', { class: 'play' });
    app.replaceChildren(
      h('a', { class: 'back', href: '#/progreso' }, icon('left', 16), 'Progreso'),
      pageHead('Práctica de temas débiles', `Preguntas de: ${secs.map(s => `${s} ${QA.TOPICS[s]}`).join(' · ')}`),
      root);
    if (!pool.length) return root.replaceChildren(empty('No hay preguntas para practicar', null));
    QA.setContext(null);
    QA.quiz(root, { items: pool, src: 'practica', forceShuffle: true, cols: 1 }, (score, max) => {
      root.replaceChildren(h('div', { class: 'card result' },
        h('div', { class: 'score' }, `${score} / ${max}`),
        h('p', null, 'Tus estadísticas por tema se actualizaron. Las que fallaste están en tu repaso.'),
        h('div', { class: 'actions' },
          btn('Ver preparación', { href: '#/progreso' }),
          btn('Otra ronda', { variant: 'primary', onclick: () => weakPractice(app) }))));
    });
  }

  /* ---------- Panel de preparación (en Progreso) ---------- */
  function readinessPanel() {
    const est = estimate();
    const lastMock = QA.state.mocks[QA.state.mocks.length - 1];
    const estBox = est.ready
      ? h('div', { class: 'estimate' },
        h('strong', null, `≈ ${est.score}/40`),
        chip(est.score >= PASS_SCORE ? 'Por encima del aprobado' : 'Por debajo del aprobado', est.score >= PASS_SCORE ? 'ok' : 'warn'),
        h('p', { class: 'muted small' }, `Estimación orientativa: tu precisión en cada capítulo ponderada por las preguntas que ese capítulo tiene en el examen real (basada en ${est.total} respuestas).`))
      : h('div', { class: 'estimate' },
        h('strong', null, '—'),
        h('p', { class: 'muted small' }, est.total < 30
          ? `Responde al menos ${30 - est.total} preguntas más para calcular una estimación.`
          : `Faltan datos ${est.missing.length === 1 ? `del capítulo ${est.missing[0]}` : `de los capítulos ${est.missing.join(', ')}`} (al menos 3 respuestas por capítulo). Practícalo o rinde un simulacro.`));

    const chapters = [1, 2, 3, 4, 5, 6].map(ch => {
      const secs = Object.keys(QA.TOPICS).filter(s => s[0] === String(ch));
      return h('tbody', null,
        h('tr', { class: 'group' }, h('td', { colspan: '3' }, `Capítulo ${ch}`)),
        secs.map(s => {
          const t = QA.state.topics[s];
          const a = t && t.seen ? pct(t.correct, t.seen) : null;
          return h('tr', null,
            h('td', null, h('span', { class: 'ref' }, s), ' ', QA.TOPICS[s]),
            h('td', { class: 'meter-cell' }, a === null ? h('span', { class: 'muted small' }, 'sin datos') : meter(a, a >= 80 ? 'ok' : a >= 60 ? 'warn' : 'bad')),
            h('td', { class: 'num' }, a === null ? '—' : `${a}% · ${t.seen}`));
        }));
    });

    return h('section', { class: 'panel readiness' },
      h('div', { class: 'panel-head' }, h('h2', null, 'Preparación para el examen'),
        h('div', { class: 'row no-print' },
          btn('Practicar mis temas débiles', { small: true, variant: 'primary', href: '#/practica' }),
          btn('Imprimir informe', { small: true, icon: 'printer', onclick: () => window.print() }))),
      h('div', { class: 'readiness-top' },
        estBox,
        h('div', { class: 'estimate' },
          h('strong', null, lastMock ? `${lastMock.score}/${lastMock.max}` : '—'),
          lastMock ? chip(lastMock.passed ? 'Aprobado' : 'No aprobado', lastMock.passed ? 'ok' : 'bad') : null,
          h('p', { class: 'muted small' }, lastMock ? `Último simulacro oficial, ${fmtDate(lastMock.date)}.` : 'Todavía no rendiste un simulacro oficial.'),
          h('a', { class: 'link no-print', href: '#/simulacro' }, 'Ir al simulacro')),
        h('div', { class: 'estimate' },
          h('strong', null, QA.reviewDue().length),
          h('p', { class: 'muted small' }, `preguntas para repasar hoy · racha de ${QA.state.streak.count} ${QA.state.streak.count === 1 ? 'día' : 'días'}`),
          h('a', { class: 'link no-print', href: '#/repaso' }, 'Ir al repaso'))),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data topics' },
        h('thead', null, h('tr', null, h('th', null, 'Tema del temario'), h('th', null, 'Aciertos'), h('th', { class: 'num' }, '% · respuestas'))),
        chapters)));
  }

  const stat = (label, value) => h('div', { class: 'stat' }, h('span', null, label), h('strong', null, value));

  return { review, mock, weakPractice, readinessPanel, estimate, weakTopics };
})();
