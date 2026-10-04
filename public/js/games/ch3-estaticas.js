/* Capítulo 3 - Pruebas estáticas */
(() => {
  const { h, quiz } = QA;

  const DOCS = [
    {
      title: 'HU-101 · Inicio de sesión',
      lines: [
        { t: 'Como usuario registrado quiero iniciar sesión para acceder a mi cuenta.' },
        { t: 'El usuario ingresa su email y contraseña.' },
        { t: 'El sistema debe responder rápido.', bug: 'Ambigüedad / no comprobable: ¿qué es "rápido"? Debería ser medible (p. ej. < 2 s).' },
        { t: 'Tras 3 intentos fallidos la cuenta se bloquea durante 15 minutos.' },
        { t: 'Tras 5 intentos fallidos se muestra un captcha.', bug: 'Inconsistencia: con 3 intentos la cuenta ya está bloqueada, nunca se llega a 5.' },
        { t: 'Si las credenciales son correctas, el usuario accede al panel principal.' },
        { t: 'Si son incorrectas, el sistema hace lo que corresponda.', bug: 'Incompleto: no especifica el comportamiento esperado (mensaje, contador, etc.).' },
        { t: 'La contraseña se almacena cifrada con un algoritmo de hash seguro.' },
      ],
    },
    {
      title: 'REQ-220 · Cálculo de envío',
      lines: [
        { t: 'Los pedidos con subtotal mayor a $50 tienen envío gratis.' },
        { t: 'Los pedidos con subtotal menor a $50 pagan $5 de envío.', bug: 'Omisión: ¿qué pasa con un subtotal de exactamente $50? Valor límite no cubierto.' },
        { t: 'El envío internacional cuesta $20 adicionales.' },
        { t: 'Los clientes VIP siempre tienen envío gratis, excepto en envíos internacionales, que también son gratis.', bug: 'Contradicción interna: "excepto… que también son gratis". La regla es confusa.' },
        { t: 'El costo de envío se muestra antes de confirmar el pedido.' },
        { t: 'El peso máximo por paquete es de 30 kg.' },
        { t: 'Los paquetes de más de 30 kg tienen un recargo de $10.', bug: 'Inconsistencia con la línea anterior: si el máximo es 30 kg no puede haber paquetes de más de 30 kg.' },
        { t: 'Etc.', bug: 'Requisito incompleto: "Etc." no es comprobable ni implementable.' },
      ],
    },
    {
      title: 'Código · función descuento()',
      code: true,
      lines: [
        { t: 'function descuento(total, esVip) {' },
        { t: '  let d = 0;' },
        { t: '  if (total > 100) d = 0.1;' },
        { t: '  if (esVip = true) d = d + 0.05;', bug: 'Asignación en lugar de comparación (= vs ===): siempre aplica el descuento VIP.' },
        { t: '  let x = total * 2;', bug: 'Variable declarada y nunca utilizada (código muerto / anomalía de flujo de datos).' },
        { t: '  return total - total * d;' },
        { t: '  console.log("fin");', bug: 'Código inalcanzable: está después del return.' },
        { t: '}' },
      ],
    },
  ];

  function reviewDoc(root, doc, idx, total, onDone) {
    const selected = new Set();
    let checked = false;

    function render() {
      const lines = doc.lines.map((ln, i) => {
        let cls = '';
        if (checked) {
          if (ln.bug && selected.has(i)) cls = 'correct';
          else if (ln.bug) cls = 'missed';
          else if (selected.has(i)) cls = 'wrong';
        } else if (selected.has(i)) cls = 'selected';
        return h('button', {
          class: `doc-line ${cls}`,
          disabled: checked,
          onclick: () => { if (selected.has(i)) selected.delete(i); else selected.add(i); render(); },
        },
          h('span', { class: 'ln' }, i + 1),
          h('span', null,
            doc.code ? h('code', null, ln.t) : ln.t,
            checked && ln.bug ? h('span', { class: 'why' }, `Defecto: ${ln.bug}`) : null,
            checked && !ln.bug && selected.has(i) ? h('span', { class: 'why' }, 'Esta línea es correcta (falso positivo).') : null
          )
        );
      });
      const bugs = doc.lines.filter(l => l.bug).length;
      const hits = doc.lines.filter((l, i) => l.bug && selected.has(i)).length;
      const fp = doc.lines.filter((l, i) => !l.bug && selected.has(i)).length;
      const pts = Math.max(0, hits - fp);
      root.replaceChildren(
        h('div', { class: 'card' },
          h('div', { class: 'progress-line' }, h('span', null, `Documento ${idx + 1} / ${total}`)),
          h('div', { class: 'question' }, `Revisa el documento y marca las líneas que contienen defectos (hay ${bugs}).`),
          h('div', { class: 'doc' }, h('div', { class: 'doc-title' }, `${doc.title}`), lines),
          checked ? QA.feedback(pts === bugs, `${pts} / ${bugs} puntos · encontrados: ${hits}, falsos positivos: ${fp}`,
            'Las líneas en rojo punteado son defectos que no marcaste.') : null,
          h('div', { class: 'actions' },
            checked
              ? h('button', { class: 'btn primary', onclick: () => onDone(pts, bugs) }, 'Continuar →')
              : h('button', { class: 'btn primary', onclick: () => { checked = true; render(); } }, 'Terminar revisión')
          )
        )
      );
    }
    render();
  }

  QA.registerGame({
    id: 'revision-requisitos',
    chapter: 3,
    icon: 'search',
    title: 'Cazador de defectos en requisitos',
    desc: 'Haz una revisión: encuentra ambigüedades, inconsistencias y omisiones sin ejecutar nada.',
    xp: 150,
    theory: `
      Las <b>pruebas estáticas</b> evalúan productos de trabajo (requisitos, historias, código, diseño) <b>sin ejecutarlos</b>, mediante revisiones o análisis estático.
      <ul>
        <li>Detectan defectos temprano, cuando corregirlos es más barato.</li>
        <li>Encuentran defectos difíciles de hallar con pruebas dinámicas: ambigüedades, inconsistencias, omisiones, código inalcanzable, variables sin usar, desviaciones de estándares.</li>
        <li>Las pruebas estáticas encuentran <b>defectos</b> directamente; las dinámicas provocan <b>fallos</b>.</li>
      </ul>`,
    play(root, done) {
      let k = 0;
      let score = 0;
      let max = 0;
      const next = () => {
        if (k >= DOCS.length) return done(score, max);
        reviewDoc(root, DOCS[k], k, DOCS.length, (s, m) => { score += s; max += m; k++; next(); });
      };
      next();
    },
  });

  QA.registerGame({
    id: 'tipos-revision',
    chapter: 3,
    icon: 'users',
    title: 'Revisiones y roles',
    desc: 'Identifica el tipo de revisión y el rol de cada participante.',
    xp: 100,
    theory: `
      <b>Tipos de revisión</b> (de menor a mayor formalidad):
      <ul>
        <li><b>Informal:</b> sin proceso definido ni documentación formal (p. ej. "pair review").</li>
        <li><b>Recorrido (walkthrough):</b> dirigido por el autor; sirve para educar, lograr consenso, encontrar defectos.</li>
        <li><b>Revisión técnica:</b> revisores técnicamente calificados, dirigida por un moderador; busca consenso y decisiones técnicas.</li>
        <li><b>Inspección:</b> la más formal; proceso completo, métricas, roles definidos; el autor no puede ser líder ni escriba.</li>
      </ul>
      <b>Roles:</b> Gerente (decide qué revisar y da recursos), Autor, Moderador/Facilitador (asegura el buen desarrollo de las reuniones), Escriba (registra anomalías y decisiones), Revisores, Líder de la revisión (responsabilidad global).
      <br><b>Proceso:</b> Planificación → Inicio de la revisión → Revisión individual → Comunicación y análisis → Corrección e informe.`,
    play(root, done) {
      const R = ['Informal', 'Recorrido (walkthrough)', 'Revisión técnica', 'Inspección'];
      const ROLES = ['Gerente', 'Autor', 'Moderador / Facilitador', 'Escriba', 'Revisor', 'Líder de la revisión'];
      const items = [
        { q: 'Una compañera lee tu código en tu pantalla y te da comentarios rápidos, sin documentar nada.', options: R, answer: 'Informal', explain: 'No hay proceso formal ni registro.' },
        { q: 'El autor guía al equipo por su documento de diseño para explicarlo y recibir comentarios.', options: R, answer: 'Recorrido (walkthrough)', explain: 'En el walkthrough el autor dirige la sesión.' },
        { q: 'Proceso formal con criterios de entrada/salida, métricas recolectadas y roles definidos; el autor no puede ser el moderador.', options: R, answer: 'Inspección', explain: 'La inspección es el tipo de revisión más formal.' },
        { q: 'Arquitectos y desarrolladores senior evalúan una propuesta de diseño para decidir entre dos alternativas técnicas.', options: R, answer: 'Revisión técnica', explain: 'Revisores técnicamente calificados buscando consenso y decisiones técnicas.' },
        { q: '¿Quién <b>registra</b> las anomalías encontradas y las decisiones tomadas durante la reunión de revisión?', options: ROLES, answer: 'Escriba' },
        { q: '¿Quién se asegura de que las reuniones de revisión se desarrollen de forma eficaz y crea un ambiente seguro?', options: ROLES, answer: 'Moderador / Facilitador' },
        { q: '¿Quién decide qué debe revisarse y proporciona recursos como personal y tiempo?', options: ROLES, answer: 'Gerente' },
        { q: '¿Quién crea el producto de trabajo y corrige los defectos encontrados?', options: ROLES, answer: 'Autor' },
        { q: '¿Cuál es el orden correcto del proceso de revisión?', options: [
          'Planificación → Inicio → Revisión individual → Comunicación y análisis → Corrección e informe',
          'Inicio → Planificación → Corrección → Revisión individual → Informe',
          'Revisión individual → Planificación → Inicio → Informe → Corrección',
        ], answer: 'Planificación → Inicio → Revisión individual → Comunicación y análisis → Corrección e informe', cols: 1 },
        { q: '¿Cuál es un factor de éxito de las revisiones?', options: ['Usar los resultados para evaluar el desempeño de los autores', 'Definir objetivos claros y criterios de salida medibles', 'Revisar documentos enormes de una sola vez', 'Evitar la formación de los participantes'], answer: 'Definir objetivos claros y criterios de salida medibles', explain: 'Nunca se deben usar las revisiones para evaluar a las personas; conviene revisar en pequeños fragmentos y formar a los participantes.' },
      ].map(it => ({ cols: 2, keepOrder: it.options === R || it.options === ROLES, ...it }));
      quiz(root, { items }, done);
    },
  });
})();
