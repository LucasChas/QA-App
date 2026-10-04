/* Capítulo 4 - Análisis y diseño de pruebas (técnicas) */
(() => {
  const { h, quiz, multiSelect, phases, shuffle } = QA;

  /* ---------- Particiones de equivalencia y valores límite ---------- */
  QA.registerGame({
    id: 'particiones-limites',
    chapter: 4,
    icon: 'ruler',
    title: 'Particiones y valores límite',
    desc: 'Elige los valores de prueba justos: ni de más, ni de menos.',
    xp: 150,
    theory: `
      <ul>
        <li><b>Particiones de equivalencia (EP):</b> se dividen los datos en grupos que el sistema debería tratar igual. Basta con un valor por partición. Hay particiones <i>válidas</i> e <i>inválidas</i>. Cobertura = particiones probadas / particiones totales.</li>
        <li><b>Análisis de valores límite (BVA):</b> se prueban los bordes de particiones ordenadas, donde suelen esconderse los defectos.</li>
        <li><b>BVA de 2 valores:</b> el límite y su vecino más cercano en la partición adyacente. Ej. rango 1–10 → 0, 1, 10, 11.</li>
        <li><b>BVA de 3 valores:</b> el límite y sus dos vecinos. Ej. rango 1–10 → 0, 1, 2, 9, 10, 11.</li>
      </ul>`,
    play(root, done) {
      phases(root, [
        (r, d) => multiSelect(r, [
          {
            context: '<b>Requisito:</b> Para registrarse, la edad debe estar entre <b>18 y 65 años</b> (inclusive). Se ingresan números enteros.',
            q: 'Selecciona los valores de prueba según <b>BVA de 2 valores</b>.',
            options: ['0', '16', '17', '18', '19', '40', '64', '65', '66', '100'],
            correct: ['17', '18', '65', '66'],
            explain: 'Límites 18 y 65; sus vecinos en las particiones inválidas son 17 y 66.',
          },
          {
            context: '<b>Requisito:</b> En el carrito se pueden agregar entre <b>1 y 10 unidades</b> de un producto.',
            q: 'Selecciona los valores de prueba según <b>BVA de 3 valores</b>.',
            options: ['-1', '0', '1', '2', '5', '9', '10', '11', '12'],
            correct: ['0', '1', '2', '9', '10', '11'],
            explain: 'Para cada límite (1 y 10) se prueba el límite y sus dos vecinos: 0-1-2 y 9-10-11.',
          },
          {
            context: '<b>Requisito:</b> La contraseña debe tener entre <b>8 y 16 caracteres</b>.',
            q: '¿Qué longitudes pertenecen a la <b>partición válida</b>?',
            options: ['0', '7', '8', '12', '16', '17', '30'],
            correct: ['8', '12', '16'],
            explain: 'Particiones: 0–7 (inválida), 8–16 (válida), 17+ (inválida).',
          },
          {
            context: '<b>Requisito:</b> Importe de compra en euros enteros (no se aceptan negativos): <b>0–99</b> sin descuento, <b>100–499</b> 5% de descuento, <b>500 o más</b> 10% de descuento.',
            q: 'Selecciona todos los valores según <b>BVA de 2 valores</b>.',
            options: ['-1', '0', '1', '50', '99', '100', '101', '300', '499', '500', '501', '1000'],
            correct: ['-1', '0', '99', '100', '499', '500'],
            explain: 'Límites: -1|0 (inválido/válido), 99|100 y 499|500. La partición "500 o más" no tiene límite superior definido.',
          },
        ], d),
        (r, d) => quiz(r, {
          items: [
            { q: 'Para la edad válida 18–65 (enteros), ¿cuántas particiones de equivalencia hay en total (válidas e inválidas)?', options: ['1', '2', '3', '4'], answer: '3', explain: 'Menor de 18 (inválida), 18–65 (válida), mayor de 65 (inválida).' },
            { q: 'Para el importe de compra (inválido < 0; 0–99; 100–499; 500+), ¿cuántos casos de prueba se necesitan como mínimo para un 100% de cobertura de particiones?', options: ['2', '3', '4', '6'], answer: '4', explain: 'Un valor por cada partición: 1 inválida + 3 válidas = 4.' },
            { q: 'Un campo "mes" acepta valores de 1 a 12. Ya probaste 5 y 13. ¿Qué cobertura de particiones de equivalencia tienes?', options: ['33%', '50%', '67%', '100%'], answer: '67%', explain: 'Particiones: <1, 1–12, >12. Cubriste 2 de 3 = 67%.' },
            { q: '¿Por qué se prueban los valores límite?', options: ['Porque los desarrolladores suelen equivocarse en los bordes (p. ej. < vs <=)', 'Porque son los valores más usados por los usuarios', 'Porque así se prueban todas las combinaciones', 'Porque reemplazan a las pruebas de regresión'], answer: 'Porque los desarrolladores suelen equivocarse en los bordes (p. ej. < vs <=)' },
          ],
        }, d),
      ], done);
    },
  });

  /* ---------- Tablas de decisión ---------- */
  const TABLES = [
    {
      title: 'Descuentos de la tienda',
      rules: 'Los clientes <b>VIP</b> tienen siempre un <b>10% de descuento</b>. Las compras de <b>más de $100</b> tienen <b>envío gratis</b>.',
      conditions: [
        { name: 'Cliente VIP', values: ['V', 'V', 'F', 'F'] },
        { name: 'Compra > $100', values: ['V', 'F', 'V', 'F'] },
      ],
      actions: [
        { name: '10% de descuento', values: [1, 1, 0, 0] },
        { name: 'Envío gratis', values: [1, 0, 1, 0] },
      ],
    },
    {
      title: 'Aprobación de préstamos',
      rules: 'Se <b>aprueba</b> el préstamo si el cliente tiene ingresos suficientes y un historial limpio. Si tiene ingresos suficientes pero el historial no está limpio, se aprueba solo si tiene un garante; si no tiene garante se <b>rechaza</b> y se envía a <b>revisión manual</b>. Sin ingresos suficientes siempre se <b>rechaza</b>.',
      conditions: [
        { name: 'Ingresos suficientes', values: ['V', 'V', 'V', 'V', 'F', 'F', 'F', 'F'] },
        { name: 'Historial limpio', values: ['V', 'V', 'F', 'F', 'V', 'V', 'F', 'F'] },
        { name: 'Tiene garante', values: ['V', 'F', 'V', 'F', 'V', 'F', 'V', 'F'] },
      ],
      actions: [
        { name: 'Aprobar', values: [1, 1, 1, 0, 0, 0, 0, 0] },
        { name: 'Rechazar', values: [0, 0, 0, 1, 1, 1, 1, 1] },
        { name: 'Revisión manual', values: [0, 0, 0, 1, 0, 0, 0, 0] },
      ],
    },
  ];

  function decisionTable(root, tbl, idx, onDone) {
    const cols = tbl.conditions[0].values.length;
    const grid = tbl.actions.map(() => Array(cols).fill(0));
    let checked = false;

    function render() {
      let correct = 0;
      const total = cols * tbl.actions.length;
      const head = h('tr', null, h('th', null, ''), Array.from({ length: cols }, (_, c) => h('th', null, `R${c + 1}`)));
      const condRows = tbl.conditions.map(cond =>
        h('tr', null, h('td', null, cond.name), cond.values.map(v => h('td', null, v))));
      const actRows = tbl.actions.map((act, a) =>
        h('tr', null, h('td', null, act.name), Array.from({ length: cols }, (_, c) => {
          const on = grid[a][c] === 1;
          const ok = grid[a][c] === act.values[c];
          if (ok) correct++;
          return h('td', null, h('button', {
            class: `cell-btn ${on ? 'on' : ''} ${checked ? (ok ? 'correct' : 'wrong') : ''}`,
            disabled: checked,
            title: checked && !ok ? `Debía ser ${act.values[c] ? 'X' : '–'}` : 'Clic para alternar',
            onclick: () => { grid[a][c] = on ? 0 : 1; render(); },
          }, on ? 'X' : '–'));
        })));
      root.replaceChildren(
        h('div', { class: 'card' },
          h('div', { class: 'progress-line' }, h('span', null, `Tabla ${idx + 1} / ${TABLES.length}`)),
          h('div', { class: 'question' }, `${tbl.title}`),
          h('div', { class: 'context', html: `<b>Reglas de negocio:</b> ${tbl.rules}` }),
          h('p', { class: 'muted' }, 'Completa las acciones: haz clic en cada celda para marcar con X las acciones que se ejecutan en cada regla (V = verdadero, F = falso).'),
          h('div', { class: 'table-wrap' },
            h('table', { class: 'dt' },
              h('thead', null, head),
              h('tbody', null,
                h('tr', { class: 'section' }, h('td', { colspan: cols + 1 }, 'Condiciones')),
                condRows,
                h('tr', { class: 'section' }, h('td', { colspan: cols + 1 }, 'Acciones')),
                actRows
              )
            )
          ),
          checked ? QA.feedback(correct === total, `${correct} / ${total} celdas correctas`,
            `Cada columna es una <b>regla</b> = un caso de prueba. Con ${tbl.conditions.length} condiciones booleanas hay 2<sup>${tbl.conditions.length}</sup> = ${cols} reglas.`) : null,
          h('div', { class: 'actions' },
            checked
              ? h('button', { class: 'btn primary', onclick: () => onDone(correct, total) }, 'Continuar →')
              : h('button', { class: 'btn primary', onclick: () => { checked = true; render(); } }, 'Comprobar')
          )
        )
      );
    }
    render();
  }

  QA.registerGame({
    id: 'tabla-decision',
    chapter: 4,
    icon: 'table',
    title: 'Tablas de decisión',
    desc: 'Completa las acciones de cada regla de negocio y descubre combinaciones ocultas.',
    xp: 140,
    theory: `
      Las <b>tablas de decisión</b> sirven para probar reglas de negocio con <b>combinaciones de condiciones</b>.
      <ul>
        <li>Filas superiores: condiciones (V/F). Filas inferiores: acciones (X = se ejecuta, – = no).</li>
        <li>Cada <b>columna</b> es una regla de decisión y normalmente un caso de prueba.</li>
        <li>Con <i>n</i> condiciones booleanas hay 2<sup>n</sup> combinaciones; la tabla puede minimizarse fusionando columnas.</li>
        <li>Ayudan a encontrar huecos y contradicciones en los requisitos.</li>
      </ul>`,
    play(root, done) {
      let k = 0;
      let score = 0;
      let max = 0;
      const next = () => {
        if (k >= TABLES.length) {
          return quiz(root, {
            items: [
              { q: 'Si una regla de negocio tiene <b>4 condiciones booleanas</b>, ¿cuántas reglas tiene la tabla de decisión completa?', options: ['4', '8', '16', '32'], answer: '16', explain: '2<sup>4</sup> = 16 combinaciones.' },
              { q: 'En la tabla de préstamos, las reglas R5–R8 (sin ingresos suficientes) tienen la misma acción. ¿Qué se puede hacer?', options: ['Fusionarlas en una sola columna con "–" (indiferente) en las demás condiciones', 'Eliminarlas porque no son importantes', 'Duplicarlas para más cobertura', 'Convertirlas en pruebas de rendimiento'], answer: 'Fusionarlas en una sola columna con "–" (indiferente) en las demás condiciones', explain: 'Es la minimización (colapso) de la tabla de decisión.' },
            ],
          }, (s, m) => done(score + s, max + m));
        }
        decisionTable(root, TABLES[k], k, (s, m) => { score += s; max += m; k++; next(); });
      };
      next();
    },
  });

  /* ---------- Transición de estados ---------- */
  const STATES = ['Creado', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];
  const EVENTS = ['pagar', 'enviar', 'entregar', 'cancelar'];
  const TRANSITIONS = {
    Creado: { pagar: 'Pagado', cancelar: 'Cancelado' },
    Pagado: { enviar: 'Enviado', cancelar: 'Cancelado' },
    Enviado: { entregar: 'Entregado' },
    Entregado: {},
    Cancelado: {},
  };
  const INVALID = 'Transición inválida';

  function diagram() {
    const NS = 'http://www.w3.org/2000/svg';
    const pos = { Creado: [20, 40], Pagado: [220, 40], Enviado: [420, 40], Entregado: [620, 40], Cancelado: [220, 190] };
    const W = 120, H = 44;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 760 250');
    svg.setAttribute('class', 'diagram');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Diagrama de estados de un pedido');
    svg.innerHTML = `
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
    const edge = (d, label, lx, ly, anchor = 'middle') => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'edge');
      g.innerHTML = `<path d="${d}" marker-end="url(#arr)"/><text x="${lx}" y="${ly}" text-anchor="${anchor}">${label}</text>`;
      svg.append(g);
    };
    edge('M140,62 L218,62', 'pagar', 179, 54);
    edge('M340,62 L418,62', 'enviar', 379, 54);
    edge('M540,62 L618,62', 'entregar', 579, 54);
    edge('M80,84 L218,206', 'cancelar', 120, 160, 'end');
    edge('M280,84 L280,188', 'cancelar', 288, 140, 'start');
    // estado inicial
    const init = document.createElementNS(NS, 'g');
    init.setAttribute('class', 'edge');
    init.innerHTML = '<path d="M80,6 L80,38" marker-end="url(#arr)"/><text x="88" y="20" text-anchor="start">inicio</text>';
    svg.append(init);
    STATES.forEach(s => {
      const [x, y] = pos[s];
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'state');
      g.innerHTML = `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="22"/><text x="${x + W / 2}" y="${y + H / 2 + 5}" text-anchor="middle">${s}</text>`;
      svg.append(g);
    });
    return h('div', { class: 'context' }, svg);
  }

  QA.registerGame({
    id: 'transicion-estados',
    chapter: 4,
    icon: 'branch',
    title: 'Transición de estados',
    desc: 'Navega el ciclo de vida de un pedido y detecta transiciones inválidas.',
    xp: 140,
    theory: `
      Las <b>pruebas de transición de estados</b> modelan el comportamiento de un sistema según su estado actual y los eventos que recibe.
      <ul>
        <li>Elementos: estados, transiciones, eventos (y opcionalmente condiciones de guarda y acciones).</li>
        <li><b>Cobertura de todos los estados:</b> visitar cada estado.</li>
        <li><b>Cobertura de transiciones válidas</b> (0-switch): ejercitar cada transición válida.</li>
        <li><b>Cobertura de todas las transiciones:</b> transiciones válidas + intentar las inválidas (en la tabla de estados).</li>
      </ul>`,
    play(root, done) {
      const pairs = [];
      STATES.forEach(s => EVENTS.forEach(e => pairs.push([s, e])));
      const valid = shuffle(pairs.filter(([s, e]) => TRANSITIONS[s][e]));
      const invalid = shuffle(pairs.filter(([s, e]) => !TRANSITIONS[s][e]));
      const picked = shuffle(valid.slice(0, 4).concat(invalid.slice(0, 4)));
      const options = [...STATES, INVALID];
      const generated = picked.map(([s, e]) => {
        const target = TRANSITIONS[s][e] || INVALID;
        return {
          context: diagram(),
          q: `El pedido está en estado <b>${s}</b> y ocurre el evento <b>"${e}"</b>. ¿Cuál es el estado resultante?`,
          options,
          answer: target,
          cols: 2,
          explain: target === INVALID
            ? `Desde <b>${s}</b> no existe una transición para "${e}": el sistema debería rechazar el evento y seguir en ${s}. ¡Probar transiciones inválidas encuentra muchos bugs!`
            : `${s} --${e}--> ${target}.`,
        };
      });
      const fixed = [
        { context: diagram(), q: '¿Cuántas transiciones <b>válidas</b> tiene el diagrama?', options: ['3', '4', '5', '6'], answer: '5', explain: 'pagar, enviar, entregar y dos "cancelar" (desde Creado y desde Pagado).' },
        { context: diagram(), q: 'Cada caso de prueba empieza en <b>Creado</b>. ¿Cuántos casos de prueba se necesitan como mínimo para la <b>cobertura de transiciones válidas</b>?', options: ['1', '2', '3', '5'], answer: '3', explain: 'Creado→Pagado→Enviado→Entregado; Creado→Cancelado; Creado→Pagado→Cancelado. Entregado y Cancelado son estados finales.' },
        { context: diagram(), q: '¿Qué tipo de cobertura exige además probar eventos que <b>no</b> deberían provocar transición?', options: ['Cobertura de todos los estados', 'Cobertura de transiciones válidas', 'Cobertura de todas las transiciones', 'Cobertura de sentencias'], answer: 'Cobertura de todas las transiciones', explain: 'Incluye las transiciones válidas y los intentos de transiciones inválidas.' },
      ];
      quiz(root, { items: generated.concat(fixed), shuffle: false, keepOrder: true }, done);
    },
  });

  /* ---------- Elegir técnica + caja blanca + experiencia ---------- */
  QA.registerGame({
    id: 'elige-tecnica',
    chapter: 4,
    icon: 'compass',
    title: 'Elige la técnica',
    desc: 'Caja blanca, cobertura de código, técnicas basadas en la experiencia y colaboración.',
    xp: 130,
    theory: `
      <ul>
        <li><b>Caja negra:</b> EP, BVA, tablas de decisión, transición de estados.</li>
        <li><b>Caja blanca:</b> <i>cobertura de sentencias</i> (cada sentencia ejecutable se ejecuta) y <i>cobertura de ramas</i> (cada rama de cada decisión). 100% de ramas implica 100% de sentencias, pero no al revés.</li>
        <li><b>Basadas en la experiencia:</b> predicción de errores (<i>error guessing</i>, ataques de fallos), pruebas exploratorias (sesiones con un <i>charter</i>), pruebas basadas en listas de comprobación.</li>
        <li><b>Enfoques colaborativos:</b> historias de usuario (3C: Card, Conversation, Confirmation), criterios de aceptación y ATDD.</li>
      </ul>`,
    play(root, done) {
      const items = [
        {
          context: '<pre class="code">function clasificar(n) {\n  if (n > 0) {\n    print("positivo");\n  }\n  print("fin");\n}</pre>',
          q: '¿Cuántos casos de prueba se necesitan como mínimo para lograr <b>100% de cobertura de sentencias</b>?',
          options: ['1', '2', '3', '4'], answer: '1', explain: 'Con n = 5 se ejecutan todas las sentencias.',
        },
        {
          context: '<pre class="code">function clasificar(n) {\n  if (n > 0) {\n    print("positivo");\n  }\n  print("fin");\n}</pre>',
          q: '¿Y para <b>100% de cobertura de ramas</b>?',
          options: ['1', '2', '3', '4'], answer: '2', explain: 'Se necesita una prueba con la decisión verdadera (n = 5) y otra con la decisión falsa (n = -1).',
        },
        {
          context: '<pre class="code">if (a > 10) {\n  x = 1;\n} else {\n  x = 2;\n}\nif (b == 0) {\n  y = 0;\n}</pre>',
          q: '¿Mínimo de casos para <b>100% de cobertura de ramas</b>?',
          options: ['1', '2', '3', '4'], answer: '2', explain: 'Ej.: (a=11, b=0) cubre V/V y (a=5, b=1) cubre F/F. Las 4 ramas quedan cubiertas con 2 pruebas.',
        },
        { q: '¿Cuál afirmación es correcta?', options: ['100% de cobertura de ramas garantiza 100% de cobertura de sentencias', '100% de cobertura de sentencias garantiza 100% de cobertura de ramas', 'Ambas coberturas son siempre iguales', 'La cobertura de código garantiza que no hay defectos'], answer: '100% de cobertura de ramas garantiza 100% de cobertura de sentencias' },
        { q: 'Un tester experimentado prueba dividir entre cero, campos vacíos y caracteres especiales porque "ahí siempre fallan las apps".', options: ['Predicción de errores', 'Pruebas exploratorias', 'Tabla de decisión', 'Cobertura de ramas'], answer: 'Predicción de errores', explain: 'Error guessing: anticipar errores según la experiencia (también se pueden usar ataques de fallos).' },
        { q: 'Durante una sesión de 90 minutos con el objetivo "Explorar el checkout con distintos métodos de pago para descubrir riesgos", el tester diseña y ejecuta pruebas sobre la marcha.', options: ['Pruebas exploratorias basadas en sesiones', 'Pruebas basadas en listas de comprobación', 'Análisis de valores límite', 'Pruebas de componente'], answer: 'Pruebas exploratorias basadas en sesiones', explain: 'Se usa un charter (objetivo) y un tiempo limitado; diseño, ejecución y aprendizaje son simultáneos.' },
        { q: 'El tester verifica la app contra una lista: "¿Todos los botones tienen texto alternativo? ¿Los mensajes de error son claros?…"', options: ['Pruebas basadas en listas de comprobación', 'Predicción de errores', 'Transición de estados', 'Pruebas de mutación'], answer: 'Pruebas basadas en listas de comprobación' },
        { q: 'Un sistema de seguros calcula la prima combinando edad, historial de siniestros y tipo de vehículo. ¿Qué técnica es la más adecuada?', options: ['Tabla de decisión', 'Transición de estados', 'Cobertura de sentencias', 'Predicción de errores'], answer: 'Tabla de decisión', explain: 'Las combinaciones de condiciones son el escenario ideal para tablas de decisión.' },
        { q: 'Las "3 C" de una historia de usuario son…', options: ['Card, Conversation, Confirmation', 'Code, Commit, Coverage', 'Cliente, Calidad, Costo', 'Crear, Comprobar, Cerrar'], answer: 'Card, Conversation, Confirmation', explain: 'Tarjeta (la historia), conversación (cómo se usará) y confirmación (criterios de aceptación).' },
        { q: 'Los criterios de aceptación en formato "Dado / Cuando / Entonces" son de tipo…', options: ['Orientados a escenarios', 'Orientados a reglas', 'Orientados al código', 'No funcionales'], answer: 'Orientados a escenarios', explain: 'El formato Given/When/Then (BDD) es el orientado a escenarios; las listas de verificación son orientadas a reglas.' },
      ].map(it => ({ cols: 2, ...it }));
      quiz(root, { items, shuffle: false }, done);
    },
  });
})();
