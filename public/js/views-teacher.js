/* Panel del profesor: exámenes (crear, editar, publicar, resultados) y alumnos. */
const TeacherViews = (() => {
  const { h } = QA;
  const { pageHead, btn, chip, icon, empty, loading, fmtDate, fmtDay, meter } = UI;

  /* ---------- Listado de exámenes ---------- */
  function exams(app) {
    const box = h('div', null, loading());
    app.replaceChildren(
      pageHead('Exámenes', 'Crea exámenes, asígnalos a tus alumnos y revisa los resultados.',
        btn('Nuevo examen', { variant: 'primary', icon: 'plus', href: '#/profesor/examenes/nuevo' })),
      box);
    API.get('/api/exams').then(({ exams: list }) => {
      if (!list.length) return box.replaceChildren(empty('Todavía no hay exámenes', 'Crea el primero: puedes escribir preguntas propias o tomarlas del banco ISTQB.',
        btn('Nuevo examen', { variant: 'primary', href: '#/profesor/examenes/nuevo' })));
      box.replaceChildren(h('div', { class: 'table-wrap panel flush' }, h('table', { class: 'data' },
        h('thead', null, h('tr', null, ['Examen', 'Estado', 'Preguntas', 'Entregas', 'Promedio', 'Aprobados', 'Fecha límite', ''].map((c, i) =>
          h('th', { class: i >= 2 && i <= 5 ? 'num' : '' }, c)))),
        h('tbody', null, list.map(e => h('tr', null,
          h('td', null, h('a', { class: 'strong', href: `#/profesor/examenes/${e.id}/resultados` }, e.title)),
          h('td', null, chip(e.published ? 'Publicado' : 'Borrador', e.published ? 'ok' : '')),
          h('td', { class: 'num' }, e.questionCount),
          h('td', { class: 'num' }, `${e.takers}/${e.assignedCount}`),
          h('td', { class: 'num' }, e.avg === null ? '—' : `${e.avg}%`),
          h('td', { class: 'num' }, e.attemptsCount ? `${e.passed}/${e.attemptsCount}` : '—'),
          h('td', null, fmtDay(e.dueDate)),
          h('td', { class: 'row-actions' },
            btn('', { small: true, icon: 'chart', title: 'Resultados', href: `#/profesor/examenes/${e.id}/resultados` }),
            btn('', { small: true, icon: 'edit', title: 'Editar', href: `#/profesor/examenes/${e.id}` }),
            btn('', { small: true, icon: 'copy', title: 'Duplicar', onclick: () => duplicate(e.id) }),
            btn('', { small: true, icon: 'trash', title: 'Eliminar', onclick: () => remove(e) }))))))));
    }).catch(err => box.replaceChildren(h('p', null, err.message)));

    async function duplicate(id) {
      try {
        const { exam } = await API.get(`/api/exams/${id}`);
        await API.post('/api/exams', { ...exam, title: `${exam.title} (copia)`, published: false });
        QA.toast('Examen duplicado como borrador.');
        exams(app);
      } catch (err) { QA.toast(err.message); }
    }
    async function remove(e) {
      const ok = await UI.confirm('Eliminar examen', `Se eliminará "${e.title}" junto con ${e.attemptsCount} ${e.attemptsCount === 1 ? 'entrega' : 'entregas'}. No se puede deshacer.`, 'Eliminar', 'danger');
      if (!ok) return;
      try { await API.del(`/api/exams/${e.id}`); QA.toast('Examen eliminado.'); exams(app); }
      catch (err) { QA.toast(err.message); }
    }
  }

  /* ---------- Editor ---------- */
  function editor(app, examId) {
    app.replaceChildren(loading());
    Promise.all([
      examId ? API.get(`/api/exams/${examId}`).then(r => r.exam) : Promise.resolve(null),
      API.get('/api/users').then(r => r.users.filter(u => u.role === 'alumno')),
    ]).then(([exam, students]) => buildEditor(app, exam, students))
      .catch(err => app.replaceChildren(empty('No se pudo abrir el editor', err.message)));
  }

  function buildEditor(app, exam, students) {
    const isNew = !exam;
    const model = exam ? JSON.parse(JSON.stringify(exam)) : {
      title: '', description: '', timeLimit: 30, passPct: 65, attemptsAllowed: 1, showAnswers: true,
      published: false, assignedTo: 'all', dueDate: null,
      questions: [{ q: '', options: ['', '', '', ''], answer: 0, explain: '' }],
    };
    const err = UI.errorBox();
    const qBox = h('div', { class: 'qe-list' });
    const countEl = h('span', { class: 'muted small' });

    const input = (id, value, attrs = {}) => h('input', { id, class: 'input', value: value ?? '', ...attrs });
    const f = {
      title: input('ex-title', model.title, { maxlength: '200', placeholder: 'Parcial 1: Fundamentos y técnicas' }),
      description: h('textarea', { id: 'ex-desc', class: 'input', rows: '2', maxlength: '2000', placeholder: 'Instrucciones para los alumnos' }),
      timeLimit: input('ex-time', model.timeLimit, { type: 'number', min: '0', max: '300' }),
      passPct: input('ex-pass', model.passPct, { type: 'number', min: '1', max: '100' }),
      attempts: input('ex-attempts', model.attemptsAllowed, { type: 'number', min: '1', max: '20' }),
      due: input('ex-due', model.dueDate ? toLocalInput(model.dueDate) : '', { type: 'datetime-local' }),
      showAnswers: h('input', { id: 'ex-show', type: 'checkbox' }),
      published: h('input', { id: 'ex-pub', type: 'checkbox' }),
    };
    f.description.value = model.description || '';
    f.showAnswers.checked = model.showAnswers;
    f.published.checked = model.published;

    /* Asignación */
    const assignAll = h('input', { type: 'radio', name: 'assign', id: 'as-all', value: 'all' });
    const assignSome = h('input', { type: 'radio', name: 'assign', id: 'as-some', value: 'some' });
    const selected = new Set(Array.isArray(model.assignedTo) ? model.assignedTo : []);
    (model.assignedTo === 'all' ? assignAll : assignSome).checked = true;
    const studentList = h('div', { class: 'student-pick', hidden: model.assignedTo === 'all' },
      students.length ? students.map(s => {
        const cb = h('input', { type: 'checkbox', id: `st-${s.id}`, onchange: e => { if (e.target.checked) selected.add(s.id); else selected.delete(s.id); } });
        cb.checked = selected.has(s.id);
        return h('label', { class: 'check', for: `st-${s.id}` }, cb, h('span', null, s.name), h('span', { class: 'muted small' }, s.email));
      }) : h('p', { class: 'muted' }, 'Todavía no hay alumnos registrados.'));
    [assignAll, assignSome].forEach(r => r.addEventListener('change', () => { studentList.hidden = assignAll.checked; }));

    function renderQuestions() {
      countEl.textContent = `${model.questions.length} ${model.questions.length === 1 ? 'pregunta' : 'preguntas'}`;
      qBox.replaceChildren(...model.questions.map((q, k) => {
        const text = h('textarea', { id: `qe-${k}-q`, class: 'input', rows: '2', maxlength: '2000', placeholder: 'Enunciado de la pregunta', oninput: e => { q.q = e.target.value; } });
        text.value = q.q;
        const explain = h('textarea', { id: `qe-${k}-ex`, class: 'input', rows: '1', maxlength: '2000', placeholder: 'Explicación (opcional, se muestra en la revisión)', oninput: e => { q.explain = e.target.value; } });
        explain.value = q.explain || '';
        const opts = h('div', { class: 'qe-options' }, q.options.map((o, idx) => {
          const radio = h('input', { type: 'radio', name: `qe-${k}-ans`, id: `qe-${k}-r${idx}`, title: 'Marcar como correcta', onchange: () => { q.answer = idx; } });
          radio.checked = q.answer === idx;
          const txt = h('input', { id: `qe-${k}-o${idx}`, class: 'input', value: o, maxlength: '500', placeholder: `Opción ${idx + 1}`, oninput: e => { q.options[idx] = e.target.value; } });
          return h('div', { class: 'qe-opt' }, radio, txt,
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Quitar opción', disabled: q.options.length <= 2, onclick: () => {
              q.options.splice(idx, 1);
              if (q.answer >= q.options.length) q.answer = q.options.length - 1;
              else if (q.answer > idx) q.answer--;
              renderQuestions();
            } }, icon('x', 16)));
        }));
        return h('article', { class: 'qe' },
          h('div', { class: 'qe-head' },
            h('span', { class: 'q-num' }, `Pregunta ${k + 1}`),
            h('span', { class: 'spacer' }),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Subir', disabled: k === 0, onclick: () => { [model.questions[k - 1], model.questions[k]] = [model.questions[k], model.questions[k - 1]]; renderQuestions(); } }, icon('up', 16)),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Bajar', disabled: k === model.questions.length - 1, onclick: () => { [model.questions[k + 1], model.questions[k]] = [model.questions[k], model.questions[k + 1]]; renderQuestions(); } }, icon('down', 16)),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Eliminar pregunta', onclick: () => { model.questions.splice(k, 1); renderQuestions(); } }, icon('trash', 16))),
          text,
          h('p', { class: 'muted small' }, 'Marca el círculo de la opción correcta.'),
          opts,
          q.options.length < 6 ? h('button', { class: 'link-btn', type: 'button', onclick: () => { q.options.push(''); renderQuestions(); } }, '+ Agregar opción') : null,
          explain);
      }));
      if (!model.questions.length) qBox.append(empty('Sin preguntas', 'Agrega una pregunta propia o importa del banco ISTQB.'));
    }

    function importFromBank() {
      const picked = new Set();
      let ch = 0;
      const listBox = h('div', { class: 'bank-list' });
      const renderBank = () => {
        listBox.replaceChildren(...QA.questionBank.map((q, i) => ({ q, i })).filter(x => !ch || x.q.ch === ch).map(({ q, i }) => {
          const cb = h('input', { type: 'checkbox', id: `bank-${i}`, onchange: e => { if (e.target.checked) picked.add(i); else picked.delete(i); } });
          cb.checked = picked.has(i);
          const tmp = document.createElement('div');
          tmp.innerHTML = q.q;
          return h('label', { class: 'check bank-item', for: `bank-${i}` }, cb,
            h('span', null, h('span', { class: 'ref' }, `Cap. ${q.ch}`), ' ', tmp.textContent));
        }));
      };
      const chSel = h('select', { id: 'bank-ch', class: 'input', onchange: e => { ch = Number(e.target.value); renderBank(); } },
        h('option', { value: '0' }, 'Todos los capítulos'), [1, 2, 3, 4, 5, 6].map(n => h('option', { value: String(n) }, `Capítulo ${n}`)));
      renderBank();
      UI.modal('Importar del banco ISTQB', h('div', { class: 'form' }, chSel, listBox), [
        { label: 'Cancelar', onclick: c => c() },
        { label: 'Agregar seleccionadas', variant: 'primary', onclick: c => {
          const strip = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
          [...picked].sort((a, b) => a - b).forEach(i => {
            const b = QA.questionBank[i];
            // En el banco la respuesta correcta suele ser la primera opción: se mezclan al importar.
            const options = QA.shuffle(b.options);
            model.questions.push({ q: strip(b.q), options, answer: options.indexOf(b.answer), explain: b.explain ? strip(b.explain) : '' });
          });
          // quita la pregunta vacía inicial si no se usó
          model.questions = model.questions.filter(q => q.q.trim() || q.options.some(o => o.trim()));
          renderQuestions();
          c();
          if (picked.size) QA.toast(`${picked.size} ${picked.size === 1 ? 'pregunta agregada' : 'preguntas agregadas'}.`);
        } },
      ]);
    }

    async function save() {
      err.clear();
      const body = {
        title: f.title.value,
        description: f.description.value,
        timeLimit: Number(f.timeLimit.value || 0),
        passPct: Number(f.passPct.value),
        attemptsAllowed: Number(f.attempts.value),
        dueDate: f.due.value ? new Date(f.due.value).toISOString() : null,
        showAnswers: f.showAnswers.checked,
        published: f.published.checked,
        assignedTo: assignAll.checked ? 'all' : [...selected],
        questions: model.questions,
      };
      try {
        if (isNew) await API.post('/api/exams', body);
        else await API.put(`/api/exams/${exam.id}`, body);
        QA.toast(body.published ? 'Examen guardado y publicado.' : 'Examen guardado como borrador.');
        location.hash = '#/profesor/examenes';
      } catch (e) {
        err.show(e.message);
        err.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    app.replaceChildren(
      h('a', { class: 'back', href: '#/profesor/examenes' }, icon('left', 16), 'Exámenes'),
      pageHead(isNew ? 'Nuevo examen' : 'Editar examen', isNew ? null : 'Los cambios no modifican las notas de entregas anteriores.'),
      err.el,
      h('div', { class: 'editor' },
        h('div', { class: 'editor-main' },
          h('section', { class: 'panel form' },
            UI.field('Título', f.title),
            UI.field('Descripción', f.description)),
          h('section', { class: 'panel' },
            h('div', { class: 'panel-head' }, h('h2', null, 'Preguntas'), countEl),
            qBox,
            h('div', { class: 'row' },
              btn('Agregar pregunta', { icon: 'plus', onclick: () => { model.questions.push({ q: '', options: ['', '', '', ''], answer: 0, explain: '' }); renderQuestions(); } }),
              btn('Importar del banco ISTQB', { icon: 'book', onclick: importFromBank })))),
        h('aside', { class: 'editor-side' },
          h('section', { class: 'panel form' },
            h('h2', null, 'Configuración'),
            UI.field('Tiempo límite (minutos)', f.timeLimit, '0 = sin límite'),
            UI.field('Porcentaje para aprobar', f.passPct),
            UI.field('Intentos permitidos', f.attempts),
            UI.field('Fecha límite', f.due, 'Opcional'),
            h('label', { class: 'check', for: 'ex-show' }, f.showAnswers, h('span', null, 'Mostrar respuestas correctas al entregar'))),
          h('section', { class: 'panel form' },
            h('h2', null, 'Asignación'),
            h('label', { class: 'check', for: 'as-all' }, assignAll, h('span', null, `Todos los alumnos (${students.length})`)),
            h('label', { class: 'check', for: 'as-some' }, assignSome, h('span', null, 'Alumnos seleccionados')),
            studentList),
          h('section', { class: 'panel form' },
            h('label', { class: 'check', for: 'ex-pub' }, f.published, h('span', null, h('strong', null, 'Publicar'), h('br'), h('span', { class: 'muted small' }, 'Los alumnos asignados podrán verlo y rendirlo.'))),
            btn('Guardar examen', { variant: 'primary', onclick: save })))));
    renderQuestions();
  }

  function toLocalInput(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- Resultados ---------- */
  function results(app, examId) {
    app.replaceChildren(loading());
    API.get(`/api/exams/${examId}/results`).then(({ exam, rows, pending, questions }) => {
      const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : null;
      const passed = rows.filter(r => r.passed).length;
      const csv = () => {
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = [['Alumno', 'Email', 'Puntaje', 'Total', 'Porcentaje', 'Aprobado', 'Entregado', 'Fuera de tiempo'].map(esc).join(',')]
          .concat(rows.map(r => [r.user.name, r.user.email, r.score, r.max, r.pct, r.passed ? 'Sí' : 'No', fmtDate(r.submittedAt), r.late ? 'Sí' : 'No'].map(esc).join(',')));
        const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `resultados-${exam.title.replace(/[^\w-]+/g, '-').toLowerCase()}.csv` });
        document.body.append(a); a.click(); a.remove();
      };
      app.replaceChildren(
        h('a', { class: 'back', href: '#/profesor/examenes' }, icon('left', 16), 'Exámenes'),
        pageHead(exam.title, `Resultados · se aprueba con ${exam.passPct}%`, h('div', { class: 'row' },
          btn('Editar', { icon: 'edit', href: `#/profesor/examenes/${exam.id}` }),
          btn('Exportar CSV', { icon: 'download', onclick: csv, disabled: !rows.length }))),
        h('div', { class: 'stats' },
          stat('Entregas', rows.length),
          stat('Pendientes', pending.length),
          stat('Promedio', avg === null ? '—' : `${avg}%`),
          stat('Aprobados', rows.length ? `${passed} de ${rows.length}` : '—')),
        h('div', { class: 'dash two wide-left' },
          h('section', { class: 'panel flush' },
            h('div', { class: 'panel-head pad' }, h('h2', null, 'Entregas')),
            rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
              h('thead', null, h('tr', null, h('th', null, 'Alumno'), h('th', { class: 'num' }, 'Nota'), h('th', null, 'Estado'), h('th', null, 'Entregado'), h('th', null, ''))),
              h('tbody', null, rows.map(r => h('tr', null,
                h('td', null, h('div', { class: 'strong' }, r.user.name), h('div', { class: 'muted small' }, r.user.email)),
                h('td', { class: 'num' }, `${r.pct}%`, h('div', { class: 'muted small' }, `${r.score}/${r.max}`)),
                h('td', null, chip(r.passed ? 'Aprobado' : 'No aprobado', r.passed ? 'ok' : 'bad'), r.late ? chip('Tarde', 'warn') : null),
                h('td', null, fmtDate(r.submittedAt)),
                h('td', null, btn('Ver', { small: true, href: `#/profesor/intento/${r.attemptId}` }))))))) :
              empty('Sin entregas todavía', 'Cuando los alumnos entreguen verás aquí sus notas.')),
          h('div', { class: 'stack' },
            h('section', { class: 'panel' },
              h('h2', null, 'Aciertos por pregunta'),
              h('p', { class: 'muted small' }, 'Las preguntas con menos aciertos son buenos temas para repasar en clase.'),
              h('ol', { class: 'qstats' }, questions.map((q, k) => h('li', null,
                h('span', { class: 'qs-text', title: q.q }, `${k + 1}. ${q.q}`),
                q.correctPct === null ? h('span', { class: 'muted small' }, '—') : h('span', { class: 'qs-bar' }, meter(q.correctPct, q.correctPct < 50 ? 'bad' : q.correctPct < 75 ? 'warn' : 'ok'), h('span', { class: 'num' }, `${q.correctPct}%`)))))),
            h('section', { class: 'panel' },
              h('h2', null, 'Sin entregar'),
              pending.length ? h('ul', { class: 'mini-list' }, pending.map(p => h('li', null, h('span', null, p.name), h('span', { class: 'muted small' }, p.email)))) :
                h('p', { class: 'muted' }, 'Todos los alumnos asignados entregaron.')))));
    }).catch(err => app.replaceChildren(empty('No se pudieron cargar los resultados', err.message)));
  }

  const stat = (label, value) => h('div', { class: 'stat' }, h('span', null, label), h('strong', null, value));

  /* ---------- Alumnos ---------- */
  function students(app, me) {
    const box = h('div', null, loading());
    let filter = '';
    let users = [];
    const search = h('input', { id: 'st-search', class: 'input', type: 'search', placeholder: 'Buscar por nombre o email', oninput: e => { filter = e.target.value.toLowerCase(); render(); } });
    app.replaceChildren(pageHead('Alumnos', 'Personas registradas, su avance en los juegos y sus exámenes.'), h('div', { class: 'toolbar' }, search), box);

    function render() {
      const list = users.filter(u => !filter || `${u.name} ${u.email}`.toLowerCase().includes(filter));
      if (!list.length) return box.replaceChildren(empty(users.length ? 'Sin coincidencias' : 'Todavía no hay usuarios', users.length ? null : 'Comparte el enlace de la aplicación para que tus alumnos creen su cuenta.'));
      box.replaceChildren(h('div', { class: 'table-wrap panel flush' }, h('table', { class: 'data' },
        h('thead', null, h('tr', null, ['Nombre', 'Rol', 'XP', 'Juegos', 'Estrellas', 'Exámenes', 'Promedio', 'Última actividad', ''].map((c, i) =>
          h('th', { class: i >= 2 && i <= 6 ? 'num' : '' }, c)))),
        h('tbody', null, list.map(u => h('tr', null,
          h('td', null, h('a', { class: 'strong', href: `#/profesor/alumnos/${u.id}` }, u.name), h('div', { class: 'muted small' }, u.email)),
          h('td', null, chip(u.role === 'profesor' ? 'Profesor' : 'Alumno', u.role === 'profesor' ? 'accent' : '')),
          h('td', { class: 'num' }, u.xp),
          h('td', { class: 'num' }, `${u.gamesPlayed}/${QA.games.length}`),
          h('td', { class: 'num' }, u.stars),
          h('td', { class: 'num' }, u.examsTaken),
          h('td', { class: 'num' }, u.examAvg === null ? '—' : `${u.examAvg}%`),
          h('td', null, fmtDate(u.lastActivity)),
          h('td', { class: 'row-actions' },
            btn('', { small: true, icon: 'key', title: 'Restablecer contraseña', onclick: () => resetPassword(u) }),
            btn('', { small: true, icon: 'users', title: u.role === 'profesor' ? 'Cambiar a alumno' : 'Hacer profesor', onclick: () => toggleRole(u) }))))))));
    }

    function load() {
      API.get('/api/users').then(r => { users = r.users; render(); }).catch(err => box.replaceChildren(h('p', null, err.message)));
    }

    async function toggleRole(u) {
      const role = u.role === 'profesor' ? 'alumno' : 'profesor';
      const ok = await UI.confirm('Cambiar rol', role === 'profesor'
        ? `${u.name} podrá crear exámenes, ver todas las notas y gestionar usuarios.`
        : `${u.name} dejará de tener acceso al panel del profesor.`, role === 'profesor' ? 'Hacer profesor' : 'Cambiar a alumno');
      if (!ok) return;
      try {
        await API.put(`/api/users/${u.id}/role`, { role });
        QA.toast('Rol actualizado.');
        if (u.id === me.id) { location.hash = '#/'; location.reload(); return; }
        load();
      } catch (err) { QA.toast(err.message); }
    }

    function resetPassword(u) {
      const err = UI.errorBox();
      const pw = h('input', { id: 'reset-pw', class: 'input', type: 'text', minlength: '8', autocomplete: 'off' });
      UI.modal(`Nueva contraseña para ${u.name}`, h('div', { class: 'form' }, err.el,
        h('p', { class: 'muted' }, 'Se cerrarán sus sesiones abiertas. Comunícale la nueva contraseña por un canal privado.'),
        UI.field('Nueva contraseña', pw, 'Mínimo 8 caracteres.')), [
        { label: 'Cancelar', onclick: c => c() },
        { label: 'Guardar', variant: 'primary', onclick: async c => {
          err.clear();
          try { await API.put(`/api/users/${u.id}/password`, { password: pw.value }); c(); QA.toast('Contraseña restablecida.'); }
          catch (e) { err.show(e.message); }
        } },
      ]);
    }
    load();
  }

  function studentDetail(app, id) {
    app.replaceChildren(loading());
    API.get(`/api/users/${id}`).then(({ user, progress, attempts }) => {
      const p = progress || { xp: 0, results: {}, badges: [] };
      const { cur } = QA.levelFor(p.xp);
      app.replaceChildren(
        h('a', { class: 'back', href: '#/profesor/alumnos' }, icon('left', 16), 'Alumnos'),
        pageHead(user.name, `${user.email} · ${user.role === 'profesor' ? 'Profesor' : 'Alumno'} desde ${fmtDay(user.createdAt)}`),
        h('div', { class: 'stats' },
          stat('Nivel', cur.name), stat('XP', p.xp),
          stat('Juegos jugados', `${Object.keys(p.results).length}/${QA.games.length}`),
          stat('Insignias', p.badges.length)),
        h('div', { class: 'dash two' },
          h('section', { class: 'panel' },
            h('h2', null, 'Juegos'),
            h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
              h('thead', null, h('tr', null, h('th', null, 'Juego'), h('th', null, 'Estrellas'), h('th', { class: 'num' }, 'Mejor'), h('th', { class: 'num' }, 'Partidas'))),
              h('tbody', null, QA.games.map(g => {
                const r = p.results[g.id];
                return h('tr', null, h('td', null, g.title), h('td', null, QA.starsHtml(r ? r.stars : 0)),
                  h('td', { class: 'num' }, r ? `${r.best}%` : '—'), h('td', { class: 'num' }, r ? r.plays : 0));
              }))))),
          h('section', { class: 'panel' },
            h('h2', null, 'Exámenes'),
            attempts.length ? h('ul', { class: 'mini-list' }, attempts.map(a => h('li', null,
              h('a', { href: `#/profesor/intento/${a.id}` }, a.examTitle),
              chip(`${a.pct}%`, a.passed ? 'ok' : 'bad'),
              h('span', { class: 'muted small' }, fmtDay(a.submittedAt))))) :
              h('p', { class: 'muted' }, 'Todavía no rindió exámenes.'))));
    }).catch(err => app.replaceChildren(empty('No se pudo cargar el alumno', err.message)));
  }

  return { exams, editor, results, students, studentDetail };
})();
