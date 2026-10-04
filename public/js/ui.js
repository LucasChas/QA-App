/* Componentes de interfaz reutilizables. */
const UI = (() => {
  const { h } = QA;
  const { icon } = Icons;

  function pageHead(title, sub, actions) {
    return h('header', { class: 'page-head' },
      h('div', { class: 'page-head-text' },
        h('h1', null, title),
        sub ? h('p', null, sub) : null),
      actions ? h('div', { class: 'page-head-actions' }, actions) : null);
  }

  function btn(label, opts = {}) {
    return h(opts.href ? 'a' : 'button', {
      class: `btn ${opts.variant || ''} ${opts.small ? 'small' : ''}`.trim(),
      href: opts.href,
      type: opts.href ? null : (opts.type || 'button'),
      onclick: opts.onclick,
      disabled: opts.disabled,
      title: opts.title,
      'aria-label': !label && opts.title ? opts.title : null,
      target: opts.target,
      rel: opts.target ? 'noopener noreferrer' : null,
    }, opts.icon ? icon(opts.icon, 16) : null, label ? h('span', null, label) : null);
  }

  function chip(text, tone = '') {
    return h('span', { class: `chip-s ${tone}` }, text);
  }

  /** Diálogo modal. content: Node. actions: [{label, variant, onclick(close)}] */
  function modal(title, content, actions = []) {
    const dlg = h('dialog', { class: 'modal' });
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.append(
      h('div', { class: 'modal-head' }, h('h2', null, title),
        h('button', { class: 'icon-btn', 'aria-label': 'Cerrar', onclick: close }, icon('x'))),
      h('div', { class: 'modal-body' }, content),
      actions.length ? h('div', { class: 'modal-foot' }, actions.map(a =>
        btn(a.label, { variant: a.variant, onclick: () => a.onclick(close) }))) : null
    );
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
    document.body.append(dlg);
    dlg.showModal();
    return { close, el: dlg };
  }

  function confirm(title, message, okLabel = 'Confirmar', variant = 'primary') {
    return new Promise(resolve => {
      modal(title, h('p', null, message), [
        { label: 'Cancelar', onclick: c => { c(); resolve(false); } },
        { label: okLabel, variant, onclick: c => { c(); resolve(true); } },
      ]);
    });
  }

  function field(label, input, hint) {
    return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input, hint ? h('span', { class: 'field-hint' }, hint) : null);
  }

  function errorBox() {
    const el = h('div', { class: 'form-error', role: 'alert', hidden: true });
    return {
      el,
      show(msg) { el.textContent = msg; el.hidden = false; },
      clear() { el.textContent = ''; el.hidden = true; },
    };
  }

  function empty(title, text, action) {
    return h('div', { class: 'empty' }, h('h3', null, title), text ? h('p', null, text) : null, action || null);
  }

  function loading() {
    return h('div', { class: 'loading' }, 'Cargando…');
  }

  const fmtDate = iso => iso ? new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const fmtDay = iso => iso ? new Date(iso).toLocaleDateString('es', { dateStyle: 'medium' }) : '—';

  function meter(pct, tone) {
    return h('div', { class: `meter ${tone || ''}` }, h('span', { style: `width:${Math.max(0, Math.min(100, pct))}%` }));
  }

  /** Permite a cualquier usuario reportar una pregunta con errores; el profesor la revisa. */
  function reportQuestion({ source, key, text }) {
    const err = errorBox();
    const reason = h('select', { id: 'rep-reason', class: 'input' },
      h('option', { value: 'respuesta-incorrecta' }, 'La respuesta marcada como correcta es incorrecta'),
      h('option', { value: 'explicacion' }, 'La explicación es confusa o falta'),
      h('option', { value: 'redaccion' }, 'El enunciado es ambiguo o tiene errores'),
      h('option', { value: 'desactualizada' }, 'No coincide con el temario v4.0'),
      h('option', { value: 'otro' }, 'Otro problema'));
    const comment = h('textarea', { id: 'rep-comment', class: 'input', rows: '3', maxlength: '1000', placeholder: 'Opcional: qué está mal y, si sabes, cuál sería lo correcto.' });
    modal('Reportar pregunta', h('div', { class: 'form' }, err.el,
      h('blockquote', { class: 'quote-q' }, text.length > 300 ? text.slice(0, 300) + '…' : text),
      field('Motivo', reason), field('Comentario', comment)), [
      { label: 'Cancelar', onclick: c => c() },
      { label: 'Enviar reporte', variant: 'primary', onclick: async c => {
        err.clear();
        try {
          await API.post('/api/reports', { source, key, text, reason: reason.value, comment: comment.value });
          c();
          QA.toast('Gracias. Tu profesor revisará la pregunta.');
        } catch (e) { err.show(e.message); }
      } },
    ]);
  }

  return { pageHead, btn, chip, modal, confirm, field, errorBox, empty, loading, fmtDate, fmtDay, meter, icon, reportQuestion };
})();
