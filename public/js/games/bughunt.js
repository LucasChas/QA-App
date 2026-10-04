/* Capítulo 6 (práctica) - Pruebas exploratorias sobre una tienda con bugs sembrados */
(() => {
  const { h, shuffle } = QA;

  const PRODUCTS = [
    { id: 'taza', name: 'Taza QA', price: 10 },
    { id: 'remera', name: 'Camiseta "It works on my machine"', price: 25 },
    { id: 'libro', name: 'Libro de testing', price: 15 },
  ];

  const REPORTS = [
    { id: 'cantidad', real: true, text: 'Se aceptan cantidades fuera del rango permitido (negativas o mayores a 10) y alteran el total.' },
    { id: 'cupon-doble', real: true, text: 'El cupón QA10 puede aplicarse más de una vez y el descuento se acumula.' },
    { id: 'envio-50', real: true, text: 'Con un subtotal de exactamente $50 se cobra envío, cuando debería ser gratis.' },
    { id: 'edad-18', real: true, text: 'Un cliente de exactamente 18 años es rechazado en el checkout.' },
    { id: 'email', real: true, text: 'Se acepta un email sin "@" (formato inválido) al confirmar el pedido.' },
    { id: 'descuento-envio', real: true, text: 'El 10% del cupón se calcula sobre subtotal + envío en lugar de solo sobre el subtotal.' },
    { id: 'd-envio45', real: false, text: 'Una compra con subtotal de $45 cobra $5 de envío.' },
    { id: 'd-edad17', real: false, text: 'Un cliente de 17 años no puede confirmar el pedido.' },
    { id: 'd-cupon', real: false, text: 'El cupón "VERANO" es rechazado como inválido.' },
    { id: 'd-cant10', real: false, text: 'Se permite comprar 10 unidades de un mismo producto.' },
  ];

  const money = n => `$${n.toFixed(2)}`;

  QA.registerGame({
    id: 'bug-hunt',
    chapter: 6,
    icon: 'bug',
    title: 'Bug Hunt: Tienda QA',
    desc: 'Sesión de pruebas exploratorias: usa la tienda, compárala con la especificación y reporta los bugs reales.',
    xp: 200,
    theory: `
      <b>Charter de la sesión:</b> Explorar el carrito y el checkout de la Tienda QA usando la especificación como oráculo, para descubrir defectos funcionales.
      <ul>
        <li>Usa <b>valores límite</b> y <b>particiones</b> (¿qué pasa con 0, -1, 10, 11? ¿y con exactamente $50?).</li>
        <li>Usa <b>predicción de errores</b>: repetir acciones, campos con formatos inválidos…</li>
        <li>Solo puedes reportar un bug si lo <b>reprodujiste</b> en esta sesión. Reportar algo que cumple la especificación es un <b>falso positivo</b> y resta puntos.</li>
      </ul>`,
    play(root, done) {
      const qty = { taza: 0, remera: 0, libro: 0 };
      let coupons = 0;
      const triggered = new Set();
      const found = new Set();
      const rejected = new Set();
      let falsePositives = 0;
      const logLines = [];

      const logBox = h('div', { class: 'log' });
      const log = msg => {
        logLines.unshift(`${new Date().toLocaleTimeString()} · ${msg}`);
        logBox.replaceChildren(...logLines.slice(0, 40).map(l => h('div', null, l)));
      };

      const totalsBox = h('div', { class: 'totals' });
      const couponMsg = h('div');
      const checkoutMsg = h('div');

      function calc() {
        let subtotal = 0;
        PRODUCTS.forEach(p => { subtotal += p.price * qty[p.id]; });
        // BUG: debería ser subtotal >= 50
        const shipping = subtotal > 0 && !(subtotal > 50) ? 5 : 0;
        // BUG: el descuento se acumula y se calcula sobre subtotal + envío
        const discount = coupons * 0.1 * (subtotal + shipping);
        const total = subtotal + shipping - discount;
        if (Object.values(qty).some(q => q < 0 || q > 10)) triggered.add('cantidad');
        if (subtotal === 50 && shipping > 0) triggered.add('envio-50');
        if (coupons >= 2) triggered.add('cupon-doble');
        if (coupons >= 1 && shipping > 0 && subtotal > 0) triggered.add('descuento-envio');
        if (subtotal === 45 && shipping === 5) triggered.add('d-envio45');
        if (Object.values(qty).some(q => q === 10)) triggered.add('d-cant10');
        return { subtotal, shipping, discount, total };
      }

      function renderTotals() {
        const t = calc();
        totalsBox.replaceChildren(
          h('div', null, h('span', null, 'Subtotal'), h('span', null, money(t.subtotal))),
          h('div', null, h('span', null, 'Envío'), h('span', null, money(t.shipping))),
          h('div', null, h('span', null, `Descuento${coupons ? ` (cupón x${coupons})` : ''}`), h('span', null, `-${money(t.discount)}`)),
          h('div', { class: 'grand' }, h('span', null, 'Total'), h('span', null, money(t.total)))
        );
      }

      const productRows = PRODUCTS.map(p => {
        const input = h('input', {
          type: 'number', value: '0', 'aria-label': `Cantidad de ${p.name}`,
          onchange: e => {
            const v = parseInt(e.target.value, 10);
            qty[p.id] = Number.isNaN(v) ? 0 : v; // BUG: no se valida el rango 0-10
            log(`Cantidad de ${p.name} = ${qty[p.id]}`);
            renderTotals();
          },
        });
        return h('div', { class: 'product' },
          h('span', { class: 'name' }, p.name), h('span', { class: 'muted' }, money(p.price)), input);
      });

      const couponInput = h('input', { type: 'text', placeholder: 'Código de cupón', 'aria-label': 'Código de cupón' });
      const applyCoupon = () => {
        const code = couponInput.value.trim();
        if (code === 'QA10') {
          coupons++; // BUG: no se impide aplicarlo de nuevo
          couponMsg.replaceChildren(h('div', { class: 'msg ok' }, 'Cupón QA10 aplicado.'));
          log('Cupón QA10 aplicado');
        } else {
          if (code.toUpperCase() === 'VERANO') triggered.add('d-cupon');
          couponMsg.replaceChildren(h('div', { class: 'msg bad' }, 'Cupón inválido.'));
          log(`Cupón inválido: "${code}"`);
        }
        renderTotals();
      };

      const nameInput = h('input', { type: 'text', placeholder: 'Ana Pérez' });
      const emailInput = h('input', { type: 'text', placeholder: 'ana@correo.com' });
      const ageInput = h('input', { type: 'number', placeholder: '30' });

      const checkout = e => {
        e.preventDefault();
        const t = calc();
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const age = parseInt(ageInput.value, 10);
        const fail = msg => { checkoutMsg.replaceChildren(h('div', { class: 'msg bad' }, `${msg}`)); log(`Checkout rechazado: ${msg}`); };
        if (t.subtotal <= 0 && !Object.values(qty).some(q => q !== 0)) return fail('El carrito está vacío.');
        if (!name) return fail('El nombre es obligatorio.');
        if (!email) return fail('El email es obligatorio.'); // BUG: no valida el formato
        if (Number.isNaN(age)) return fail('La edad es obligatoria.');
        if (!(age > 18)) { // BUG: debería ser age >= 18
          if (age === 18) triggered.add('edad-18');
          if (age === 17) triggered.add('d-edad17');
          return fail('Debes ser mayor de edad para comprar.');
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) triggered.add('email');
        checkoutMsg.replaceChildren(h('div', { class: 'msg ok' }, `¡Pedido confirmado para ${name}! Total cobrado: ${money(t.total)}`));
        log(`Pedido confirmado (email: ${email}, edad: ${age}, total: ${money(t.total)})`);
      };

      const shop = h('div', { class: 'card shop' },
        h('h3', null, 'Tienda QA'),
        productRows,
        h('div', { class: 'row', style: 'margin-top:12px' }, couponInput, h('button', { class: 'btn small', onclick: applyCoupon }, 'Aplicar')),
        couponMsg,
        totalsBox,
        h('h3', null, 'Checkout'),
        h('form', { onsubmit: checkout },
          h('label', null, 'Nombre', nameInput),
          h('label', null, 'Email', emailInput),
          h('label', null, 'Edad', ageInput),
          h('button', { class: 'btn primary', type: 'submit' }, 'Confirmar pedido')
        ),
        checkoutMsg
      );

      const bugList = h('div', { class: 'bug-list' });
      const status = h('div', { class: 'muted' });
      const reports = shuffle(REPORTS);

      function renderBugs() {
        status.textContent = `Bugs confirmados: ${found.size} · Falsos positivos: ${falsePositives}`;
        bugList.replaceChildren(...reports.map(r => {
          const isFound = found.has(r.id);
          const isRejected = rejected.has(r.id);
          return h('div', { class: `bug-item ${isFound || isRejected ? 'found' : ''}` },
            h('button', {
              class: 'btn small',
              disabled: isFound || isRejected,
              onclick: () => {
                if (!r.real) {
                  falsePositives++;
                  rejected.add(r.id);
                  QA.toast('Rechazado: ese comportamiento cumple la especificación (falso positivo).');
                  log(`Reporte rechazado (falso positivo): ${r.text}`);
                } else if (!triggered.has(r.id)) {
                  QA.toast('Aún no lo reprodujiste en esta sesión. ¡Provócalo primero!');
                } else {
                  found.add(r.id);
                  QA.toast('¡Bug confirmado por el equipo de desarrollo!');
                  log(`Bug reportado y confirmado: ${r.text}`);
                }
                renderBugs();
              },
            }, isFound ? 'Confirmado' : isRejected ? 'Rechazado' : 'Reportar'),
            h('span', null, r.text)
          );
        }));
      }

      const side = h('div', { style: 'display:grid; gap:16px; align-content:start' },
        h('div', { class: 'card spec' },
          h('h3', { style: 'margin-top:0' }, 'Especificación (oráculo)'),
          h('ol', null,
            h('li', null, 'Cada producto admite cantidades enteras de 0 a 10.'),
            h('li', null, 'Envío: $5 si el carrito no está vacío. Gratis si el subtotal es de $50 o más.'),
            h('li', null, 'El cupón QA10 da un 10% de descuento sobre el subtotal y solo puede aplicarse una vez por pedido. Otros códigos son inválidos.'),
            h('li', null, 'Total = subtotal − descuento + envío.'),
            h('li', null, 'Checkout: nombre obligatorio, email con formato válido (usuario@dominio.ext) y edad mínima de 18 años.')
          )
        ),
        h('div', { class: 'card' },
          h('h3', { style: 'margin-top:0' }, 'Reportes candidatos'),
          h('p', { class: 'muted', style: 'margin-top:0' }, 'Reporta solo lo que reprodujiste y que contradice la especificación.'),
          status,
          bugList,
          h('div', { class: 'actions' },
            h('button', {
              class: 'btn primary',
              onclick: () => {
                const realTotal = REPORTS.filter(r => r.real).length;
                const score = Math.max(0, found.size * 2 - falsePositives);
                done(score, realTotal * 2, {
                  allBugs: found.size === realTotal && falsePositives === 0,
                  note: `Bugs encontrados: ${found.size}/${realTotal} · Falsos positivos: ${falsePositives}`,
                });
              },
            }, 'Finalizar sesión')
          )
        ),
        h('div', { class: 'card' }, h('b', null, 'Registro de la sesión'), logBox)
      );

      root.replaceChildren(h('div', { class: 'hunt' }, shop, side));
      renderTotals();
      renderBugs();
      log('Sesión exploratoria iniciada');
    },
  });
})();
