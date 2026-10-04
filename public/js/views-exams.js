/* Exámenes del alumno: listado, rendir con tiempo y ver resultados. */
const ExamViews = (() => {
  const { h } = QA;
  const { pageHead, btn, chip, icon, empty, loading, fmtDate, fmtDay, meter } = UI;

  const STATUS = {
    disponible: ['Disponible', 'accent'],
    'en-curso': ['En curso', 'warn'],
    completado: ['Completado', 'ok'],
    vencido: ['Vencido', 'bad'],
  };

  const storeKey = id => `qa-attempt-${id}`;
  const readAnswers = id => { try { return JSON.parse(sessionStorage.getItem(storeKey(id))) || {}; } catch (e) { return {}; } };
  const writeAnswers = (id, a) => { try { sessionStorage.setItem(storeKey(id), JSON.stringify(a)); } catch (e) { /* sin almacenamiento */ } };
  const dropAnswers = id => { try { sessionStorage.removeItem(storeKey(id)); } catch (e) { /* sin almacenamiento */ } };

  function facts(e) {
    return h('ul', { class: 'facts' },
      h('li', null, h('span', null, 'Preguntas'), h('strong', null, e.questionCount ?? e.questions.length)),
      h('li', null, h('span', null, 'Tiempo'), h('strong', null, e.timeLimit ? `${e.timeLimit} min` : 'Sin límite')),
      h('li', null, h('span', null, 'Aprobación'), h('strong', null, `${e.passPct}%`)),
      e.attemptsAllowed ? h('li', null, h('span', null, 'Intentos'), h('strong', null, e.attemptsAllowed)) : null,
      e.dueDate ? h('li', null, h('span', null, 'Fecha límite'), h('strong', null, fmtDate(e.dueDate))) : null);
  }

  /* ---------- Listado ---------- */
  function list(app) {
    const box = h('div', null, loading());
    app.replaceChildren(pageHead('Mis exámenes', 'Exámenes que tu profesor te asignó. El tiempo empieza a correr cuando pulsas "Comenzar".'), box);
    API.get('/api/exams').then(({ exams }) => {
      if (!exams.length) return box.replaceChildren(empty('No tienes exámenes asignados', 'Mientras tanto, practica con los juegos y el simulacro de examen.', btn('Ir a los juegos', { href: '#/juegos' })));
      box.replaceChildren(h('div', { class: 'exam-list' }, exams.map(e => {
        const [label, tone] = STATUS[e.status];
        const last = e.attempts[e.attempts.length - 1];
        return h('article', { class: 'exam-card' },
          h('div', { class: 'exam-card-main' },
            h('div', { class: 'row' }, h('h2', null, e.title), chip(label, tone)),
            e.description ? h('p', { class: 'muted' }, e.description) : null,
            facts(e)),
          h('div', { class: 'exam-card-side' },
            last ? h('div', { class: 'score-mini' }, h('strong', null, `${last.pct}%`), chip(last.passed ? 'Aprobado' : 'No aprobado', last.passed ? 'ok' : 'bad')) : null,
            e.status === 'disponible' || e.status === 'en-curso'
              ? btn(e.status === 'en-curso' ? 'Continuar' : 'Comenzar', { variant: 'primary', href: `#/examenes/${e.id}` })
              : last ? btn('Ver resultado', { href: `#/resultado/${last.id}` }) : null));
      })));
    }).catch(err => box.replaceChildren(h('p', null, err.message)));
  }

  /* ---------- Intro y rendición ---------- */
  function intro(app, examId) {
    app.replaceChildren(loading());
    API.get('/api/exams').then(({ exams }) => {
      const e = exams.find(x => x.id === examId);
      if (!e) return app.replaceChildren(empty('Examen no disponible', 'Puede que haya sido retirado o que no esté asignado a ti.', btn('Mis exámenes', { href: '#/examenes' })));
      if (e.status === 'en-curso') return take(app, examId);
      const canStart = e.status === 'disponible';
      app.replaceChildren(
        h('a', { class: 'back', href: '#/examenes' }, icon('left', 16), 'Mis exámenes'),
        pageHead(e.title, e.description || null),
        h('section', { class: 'panel narrow' },
          facts(e),
          h('ul', { class: 'rules' },
            h('li', null, e.timeLimit ? `Tienes ${e.timeLimit} minutos desde que comienzas. Al terminar el tiempo el examen se entrega solo.` : 'No hay límite de tiempo.'),
            h('li', null, 'Puedes cambiar tus respuestas hasta que entregues.'),
            h('li', null, `Tienes ${e.attemptsAllowed} ${e.attemptsAllowed === 1 ? 'intento' : 'intentos'}; ya usaste ${e.attempts.length}.`)),
          canStart ? btn('Comenzar examen', { variant: 'primary', onclick: () => take(app, examId) })
            : h('p', { class: 'muted' }, e.status === 'vencido' ? 'La fecha límite ya pasó.' : 'Ya usaste todos tus intentos.')));
    }).catch(err => app.replaceChildren(h('p', null, err.message)));
  }

  function take(app, examId) {
    app.replaceChildren(loading());
    API.post(`/api/exams/${examId}/start`).then(({ attempt, exam }) => {
      const answers = readAnswers(attempt.id);
      const offset = Date.parse(attempt.serverNow) - Date.now();
      const deadline = attempt.deadline ? Date.parse(attempt.deadline) : null;
      let submitted = false;
      let timerId = null;

      const timer = h('span', { class: 'timer' });
      const answeredEl = h('span', { class: 'muted small' });
      const nav = h('div', { class: 'q-nav' });

      function updateAnswered() {
        const n = Object.keys(answers).length;
        answeredEl.textContent = `${n} de ${exam.questions.length} respondidas`;
        nav.querySelectorAll('a').forEach((a, k) => a.classList.toggle('done', exam.questions[k].id in answers));
      }

      const cards = exam.questions.map((q, k) => h('fieldset', { class: 'q-card', id: `q-${k + 1}` },
        h('legend', null, h('span', { class: 'q-num' }, `Pregunta ${k + 1}`), h('span', { class: 'q-text' }, q.q)),
        h('div', { class: 'q-options' }, q.options.map((o, idx) => {
          const input = h('input', { type: 'radio', name: `q-${q.id}`, value: String(idx), id: `q-${q.id}-${idx}`,
            onchange: () => { answers[q.id] = idx; writeAnswers(attempt.id, answers); updateAnswered(); } });
          if (answers[q.id] === idx) input.checked = true;
          return h('label', { class: 'q-option', for: `q-${q.id}-${idx}` }, input, h('span', null, o));
        }))));
      exam.questions.forEach((q, k) => nav.append(h('a', { href: `#q-${k + 1}`, onclick: ev => {
        ev.preventDefault(); document.getElementById(`q-${k + 1}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
      } }, k + 1)));

      async function submit(auto) {
        if (submitted) return;
        submitted = true;
        clearInterval(timerId);
        try {
          const { result } = await API.post(`/api/attempts/${attempt.id}/submit`, { answers });
          dropAnswers(attempt.id);
          if (auto) QA.toast('Se terminó el tiempo: tu examen se entregó automáticamente.');
          showResult(app, result);
        } catch (err) {
          submitted = false;
          QA.toast(err.message);
        }
      }

      async function askSubmit() {
        const missing = exam.questions.length - Object.keys(answers).length;
        const msg = missing ? `Te faltan ${missing} ${missing === 1 ? 'pregunta' : 'preguntas'} por responder. ¿Entregar de todas formas?` : 'Una vez entregado no podrás cambiar tus respuestas.';
        if (await UI.confirm('Entregar examen', msg, 'Entregar')) submit(false);
      }

      function tick() {
        if (!document.body.contains(timer)) { clearInterval(timerId); return; }
        const left = Math.max(0, Math.round((deadline - (Date.now() + offset)) / 1000));
        timer.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
        timer.classList.toggle('low', left <= 60);
        if (left <= 0) submit(true);
      }

      app.replaceChildren(
        h('div', { class: 'exam-bar' },
          h('div', null, h('strong', null, exam.title), answeredEl),
          h('span', { class: 'spacer' }),
          deadline ? h('span', { class: 'timer-wrap' }, icon('clock', 16), timer) : null,
          btn('Entregar', { variant: 'primary', onclick: askSubmit })),
        nav,
        h('div', { class: 'q-list' }, cards),
        h('div', { class: 'actions' }, btn('Entregar examen', { variant: 'primary', onclick: askSubmit })));
      updateAnswered();
      if (deadline) { tick(); timerId = setInterval(tick, 1000); }
    }).catch(err => app.replaceChildren(
      empty('No se pudo abrir el examen', err.message, btn('Mis exámenes', { href: '#/examenes' }))));
  }

  /* ---------- Resultado ---------- */
  function showResult(app, r, backHref = '#/examenes', backLabel = 'Mis exámenes') {
    const review = r.review ? h('section', { class: 'review' },
      h('h2', null, 'Revisión de respuestas'),
      r.review.map((q, k) => {
        const ok = q.chosen === q.answer;
        return h('article', { class: `rv ${ok ? 'ok' : 'bad'}` },
          h('div', { class: 'rv-head' }, h('span', { class: 'q-num' }, `Pregunta ${k + 1}`), chip(ok ? 'Correcta' : q.chosen === null ? 'Sin responder' : 'Incorrecta', ok ? 'ok' : 'bad')),
          h('p', { class: 'q-text' }, q.q),
          h('ul', { class: 'rv-options' }, q.options.map((o, idx) => h('li', {
            class: [idx === q.answer ? 'is-answer' : '', idx === q.chosen && !ok ? 'is-wrong' : ''].join(' ').trim(),
          }, o, idx === q.answer ? h('span', { class: 'tag-s' }, 'Correcta') : idx === q.chosen ? h('span', { class: 'tag-s' }, 'Tu respuesta') : null))),
          q.explain ? h('p', { class: 'rv-explain' }, q.explain) : null);
      })) : h('p', { class: 'muted' }, 'Tu profesor no habilitó la revisión de respuestas para este examen.');

    app.replaceChildren(
      h('a', { class: 'back', href: backHref }, icon('left', 16), backLabel),
      pageHead(r.examTitle, r.user ? `${r.user.name} · ${r.user.email}` : `Entregado el ${fmtDate(r.submittedAt)}`),
      h('section', { class: `panel result-panel ${r.passed ? 'pass' : 'fail'}` },
        h('div', { class: 'result-score' }, h('strong', null, `${r.pct}%`), h('span', null, `${r.score} de ${r.max} correctas`)),
        h('div', { class: 'result-verdict' },
          chip(r.passed ? 'Aprobado' : 'No aprobado', r.passed ? 'ok' : 'bad'),
          h('span', { class: 'muted small' }, `Se aprueba con ${r.passPct}%`),
          r.late ? chip('Entregado fuera de tiempo', 'warn') : null,
          r.expired ? chip('Cerrado por tiempo vencido', 'warn') : null),
        meter(r.pct, r.passed ? 'ok' : 'bad')),
      review);
    window.scrollTo(0, 0);
  }

  function result(app, attemptId, teacher) {
    app.replaceChildren(loading());
    API.get(`/api/attempts/${attemptId}`).then(({ result: r }) => {
      if (teacher) showResult(app, r, `#/profesor/examenes/${r.examId}/resultados`, 'Resultados del examen');
      else showResult(app, r);
    }).catch(err => app.replaceChildren(empty('No se pudo cargar el resultado', err.message)));
  }

  return { list, intro, result };
})();
