/* Capítulo 5 - Gestión de las actividades de prueba (y capítulo 6 - herramientas) */
(() => {
  const { quiz, order, phases } = QA;

  const report = fields => `<div class="report">${Object.entries(fields)
    .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`).join('')}</div>`;

  QA.registerGame({
    id: 'reporte-defectos',
    chapter: 5,
    icon: 'file-text',
    title: 'El reporte de defectos perfecto',
    desc: 'Detecta qué le falta a cada reporte de bug y domina el ciclo de vida del defecto.',
    xp: 130,
    theory: `
      Un buen <b>informe de defecto</b> permite reproducir, analizar y corregir el problema. Contiene típicamente:
      <ul>
        <li>Identificador, título breve y descriptivo, fecha, autor.</li>
        <li>Objeto de prueba y <b>entorno</b> (versión, navegador, SO…).</li>
        <li>Contexto: caso de prueba, actividad, nivel.</li>
        <li><b>Pasos para reproducir</b>, datos usados.</li>
        <li><b>Resultado esperado</b> y <b>resultado real</b>, evidencias (capturas, logs).</li>
        <li><b>Severidad</b> (impacto técnico/negocio) y <b>prioridad</b> (urgencia de corrección), estado.</li>
      </ul>
      Debe ser objetivo, sin culpar a nadie.`,
    play(root, done) {
      const items = [
        {
          context: report({ Título: 'El login no anda', Entorno: 'Chrome 129, Windows 11, build 2.3.1', Pasos: '—', 'Resultado esperado': 'Acceder al panel', 'Resultado real': 'No anda' }),
          q: '¿Cuál es el problema <b>más grave</b> de este reporte?',
          options: ['Faltan los pasos para reproducir y el resultado real es vago', 'Falta el nombre del desarrollador culpable', 'El entorno es demasiado detallado', 'No tiene problemas'],
          answer: 'Faltan los pasos para reproducir y el resultado real es vago',
          explain: 'Sin pasos ni resultado real concreto, el desarrollador no puede reproducir el fallo.',
        },
        {
          context: report({ Título: 'Total incorrecto al aplicar cupón QA10 con 3 productos', Pasos: '1. Agregar 3 tazas ($10 c/u) 2. Aplicar cupón QA10 3. Ver total', 'Resultado esperado': '$27', 'Resultado real': '$20', Severidad: 'Alta' }),
          q: '¿Qué información importante falta?',
          options: ['El entorno (versión, navegador, dispositivo)', 'El resultado esperado', 'Los pasos para reproducir', 'Un título descriptivo'],
          answer: 'El entorno (versión, navegador, dispositivo)',
          explain: 'Sin entorno ni versión, puede ser imposible reproducir el defecto o saber si ya está corregido.',
        },
        {
          context: report({ Título: 'Otra vez el desarrollador Juan rompió el checkout, como siempre', Entorno: 'Firefox 131, build 2.3.2', Pasos: '1. Ir al checkout 2. Pulsar Pagar', 'Resultado esperado': 'Confirmación de pago', 'Resultado real': 'Error 500' }),
          q: '¿Qué principio se está violando?',
          options: ['La comunicación debe ser objetiva y no culpar a las personas', 'Los reportes deben ser lo más largos posible', 'Solo el gerente puede reportar defectos', 'Los reportes deben omitir el resultado esperado'],
          answer: 'La comunicación debe ser objetiva y no culpar a las personas',
          explain: 'El reporte debe centrarse en el producto, no en las personas. Además el título debería describir el fallo.',
        },
        {
          context: report({ Título: 'Error tipográfico "Cofirmar" en botón del pie de página de "Términos y condiciones"', Entorno: 'Todas las plataformas, v2.3' }),
          q: 'Este defecto aparece en una pantalla poco visitada y no afecta la funcionalidad. ¿Cómo lo clasificarías?',
          options: ['Severidad baja', 'Severidad crítica', 'Severidad alta', 'No es un defecto'],
          answer: 'Severidad baja',
          explain: 'Impacto bajo. Ojo: la prioridad puede variar (p. ej. un error en el logo de la portada: severidad baja, prioridad alta).',
        },
        {
          context: report({ Título: 'Se pierden todos los pedidos al reiniciar el servidor', Entorno: 'Producción, v2.3', 'Resultado real': 'La base de datos de pedidos queda vacía' }),
          q: '¿Severidad y prioridad?',
          options: ['Severidad alta, prioridad alta', 'Severidad baja, prioridad alta', 'Severidad alta, prioridad baja', 'Severidad baja, prioridad baja'],
          answer: 'Severidad alta, prioridad alta',
          explain: 'Pérdida de datos en producción: impacto crítico y corrección urgente.',
        },
        {
          q: 'El logo de la empresa aparece con el nombre mal escrito en la página principal, el día antes del lanzamiento.',
          options: ['Severidad alta, prioridad alta', 'Severidad baja, prioridad alta', 'Severidad alta, prioridad baja', 'Severidad baja, prioridad baja'],
          answer: 'Severidad baja, prioridad alta',
          explain: 'Técnicamente no afecta la funcionalidad (severidad baja), pero el impacto en la imagen exige corregirlo ya (prioridad alta).',
        },
        {
          q: 'Un defecto fue corregido por el desarrollador. ¿Cuál es el siguiente paso típico en el ciclo de vida del defecto?',
          options: ['Prueba de confirmación por parte de QA', 'Cerrar el defecto inmediatamente', 'Rechazar el defecto', 'Volver a abrirlo'],
          answer: 'Prueba de confirmación por parte de QA',
          explain: 'Tras la corrección se confirma la solución (re-test) y se ejecuta regresión; si pasa, se cierra; si no, se reabre.',
        },
        {
          q: 'Al analizar un reporte, el desarrollador concluye que el comportamiento es el especificado y el tester interpretó mal el requisito. ¿Cómo se denomina?',
          options: ['Falso positivo', 'Falso negativo', 'Defecto latente', 'Defecto enmascarado'],
          answer: 'Falso positivo',
          explain: 'Falso positivo: se reporta un defecto que no existe. Falso negativo: hay un defecto y las pruebas no lo detectan.',
        },
      ].map(it => ({ cols: 2, ...it }));
      quiz(root, { items }, done);
    },
  });

  QA.registerGame({
    id: 'riesgos',
    chapter: 5,
    icon: 'alert',
    title: 'Pruebas basadas en riesgo',
    desc: 'Clasifica riesgos de producto y de proyecto, y prioriza según su nivel.',
    xp: 130,
    theory: `
      <ul>
        <li><b>Riesgo:</b> evento potencial cuya ocurrencia tendría un efecto negativo. <b>Nivel de riesgo = probabilidad × impacto</b>.</li>
        <li><b>Riesgo de proyecto:</b> afecta la gestión y el control del proyecto (retrasos, falta de personal, problemas con proveedores, herramientas, entornos).</li>
        <li><b>Riesgo de producto:</b> relacionado con las características de calidad del producto (funcionalidad incorrecta, rendimiento pobre, vulnerabilidades, mala usabilidad).</li>
        <li>El análisis de riesgos (identificación y evaluación) orienta el alcance, la intensidad y el orden de las pruebas. Control: mitigación y monitoreo.</li>
      </ul>`,
    play(root, done) {
      const C = ['Riesgo de producto', 'Riesgo de proyecto'];
      phases(root, [
        (r, d) => quiz(r, {
          items: [
            { q: 'El entorno de pruebas no estará disponible hasta dos semanas después de lo planificado.', answer: 'Riesgo de proyecto' },
            { q: 'El cálculo de intereses podría redondear mal y cobrar de más a los clientes.', answer: 'Riesgo de producto' },
            { q: 'El único tester con conocimiento del dominio bancario renunciará el próximo mes.', answer: 'Riesgo de proyecto' },
            { q: 'La app podría tardar más de 10 segundos en cargar durante el Black Friday.', answer: 'Riesgo de producto' },
            { q: 'El proveedor externo de la API de pagos podría entregar su componente con retraso.', answer: 'Riesgo de proyecto' },
            { q: 'Los datos personales de los usuarios podrían quedar expuestos por una vulnerabilidad.', answer: 'Riesgo de producto' },
            { q: 'La herramienta de automatización elegida podría no ser compatible con la tecnología del frontend.', answer: 'Riesgo de proyecto' },
          ].map(it => ({ ...it, options: C })),
          keepOrder: true,
        }, d),
        (r, d) => order(r, {
          title: 'Prioriza estos riesgos de producto de MAYOR a MENOR nivel de riesgo',
          instructions: 'Escala 1 (bajo) a 5 (alto). Nivel de riesgo = probabilidad × impacto.',
          context: `<ul>
            <li>Cobro duplicado en el pago con tarjeta — probabilidad 3, impacto 5</li>
            <li>Error de cálculo del envío internacional — probabilidad 4, impacto 3</li>
            <li>Fallo del filtro de búsqueda por color — probabilidad 4, impacto 2</li>
            <li>Texto desalineado en la página "Sobre nosotros" — probabilidad 2, impacto 1</li>
          </ul>`,
          items: [
            'Cobro duplicado en el pago (15)',
            'Envío internacional mal calculado (12)',
            'Filtro de búsqueda por color (8)',
            'Texto desalineado en "Sobre nosotros" (2)',
          ],
          explain: 'Se prueba primero (y con mayor intensidad) lo de mayor nivel de riesgo.',
        }, d),
        (r, d) => quiz(r, {
          items: [
            { q: 'El equipo decide encargar a un tester senior las pruebas del módulo de pagos y aplicar más técnicas de prueba allí. ¿Qué actividad de gestión de riesgos es?', options: ['Mitigación del riesgo', 'Aceptación del riesgo', 'Transferencia del riesgo', 'Identificación del riesgo'], answer: 'Mitigación del riesgo', explain: 'Las pruebas son una forma de mitigar (reducir) el riesgo de producto.' },
            { q: 'Se contrata un seguro para cubrir pérdidas si el sistema falla. ¿Qué opción de respuesta al riesgo es?', options: ['Transferencia del riesgo', 'Mitigación del riesgo', 'Aceptación del riesgo', 'Plan de contingencia'], answer: 'Transferencia del riesgo' },
          ],
        }, d),
      ], done);
    },
  });

  QA.registerGame({
    id: 'gestion-pruebas',
    chapter: 5,
    icon: 'calendar',
    title: 'El test manager',
    desc: 'Planificación, criterios de entrada/salida, estimación, métricas, pirámide, cuadrantes y herramientas.',
    xp: 140,
    theory: `
      <ul>
        <li><b>Plan de pruebas:</b> contexto, supuestos, alcance, enfoque, recursos, calendario, riesgos, criterios de entrada y salida.</li>
        <li><b>Criterios de entrada</b> (definition of ready): precondiciones para empezar. <b>Criterios de salida</b> (definition of done): qué se debe cumplir para terminar.</li>
        <li><b>Estimación de tres puntos:</b> E = (a + 4m + b) / 6, con a = optimista, m = más probable, b = pesimista.</li>
        <li><b>Pirámide de pruebas:</b> muchas pruebas de bajo nivel (rápidas, aisladas) y pocas de alto nivel (lentas, end-to-end).</li>
        <li><b>Cuadrantes de pruebas ágiles:</b> combinan orientación (negocio/tecnología) con propósito (apoyar al equipo / criticar el producto).</li>
        <li><b>Gestión de la configuración:</b> identifica y controla versiones del testware y del objeto de prueba.</li>
      </ul>`,
    play(root, done) {
      const items = [
        { q: 'Estimación de tres puntos para diseñar las pruebas: optimista = 4 días, más probable = 6 días, pesimista = 14 días. ¿Cuál es la estimación?', options: ['6 días', '7 días', '8 días', '24 días'], answer: '7 días', explain: '(4 + 4·6 + 14) / 6 = 42 / 6 = 7 días.' },
        { q: '"Todas las pruebas de riesgo alto ejecutadas y ningún defecto crítico abierto". Esto es un…', options: ['Criterio de salida', 'Criterio de entrada', 'Caso de prueba', 'Riesgo de proyecto'], answer: 'Criterio de salida', explain: 'Define cuándo se puede considerar terminada la prueba.' },
        { q: '"El entorno de pruebas está disponible y la build pasó las pruebas de humo". Esto es un…', options: ['Criterio de entrada', 'Criterio de salida', 'Informe de compleción', 'Condición de prueba'], answer: 'Criterio de entrada' },
        { q: 'Según la pirámide de pruebas, ¿qué tipo de pruebas automatizadas debería haber en <b>mayor</b> cantidad?', options: ['Pruebas unitarias / de componente', 'Pruebas de interfaz end-to-end', 'Pruebas manuales exploratorias', 'Pruebas de aceptación de usuario'], answer: 'Pruebas unitarias / de componente', explain: 'Son rápidas, baratas y aisladas. Las E2E son lentas y frágiles: menos cantidad.' },
        { q: 'Las pruebas de usabilidad, exploratorias y de aceptación de usuario pertenecen al cuadrante…', options: ['Q3: orientadas al negocio, critican el producto', 'Q1: orientadas a la tecnología, apoyan al equipo', 'Q2: orientadas al negocio, apoyan al equipo', 'Q4: orientadas a la tecnología, critican el producto'], answer: 'Q3: orientadas al negocio, critican el producto', explain: 'Q1: unitarias. Q2: funcionales/historias. Q3: exploratorias, usabilidad, UAT. Q4: rendimiento, seguridad (no funcionales técnicas).' },
        { q: '¿Cuál es una <b>métrica</b> típica de avance de pruebas?', options: ['Porcentaje de casos de prueba ejecutados y aprobados', 'Cantidad de cafés del equipo', 'Líneas de código escritas por el tester', 'Número de reuniones por semana'], answer: 'Porcentaje de casos de prueba ejecutados y aprobados' },
        { q: 'Se necesita saber exactamente qué versión del código y de los casos de prueba se usaron en la ejecución de ayer. ¿Qué práctica lo permite?', options: ['Gestión de la configuración', 'Pruebas exploratorias', 'Análisis de riesgo', 'Revisión informal'], answer: 'Gestión de la configuración' },
        { q: '¿Cuál es un <b>riesgo</b> de la automatización de pruebas?', options: ['Expectativas poco realistas sobre lo que la herramienta puede hacer', 'Ejecución más rápida de la regresión', 'Mayor consistencia y repetibilidad', 'Informes automáticos'], answer: 'Expectativas poco realistas sobre lo que la herramienta puede hacer', explain: 'Otros riesgos: subestimar el mantenimiento de los scripts, depender demasiado de la herramienta, proveedor que desaparece.' },
        { q: 'Una herramienta que ejecuta pruebas en cada commit y publica el resultado en el pipeline es una herramienta de…', options: ['Ejecución y DevOps (CI/CD)', 'Gestión de requisitos', 'Revisión estática', 'Diseño gráfico'], answer: 'Ejecución y DevOps (CI/CD)' },
        { q: 'El informe que se genera al final de un nivel de prueba o proyecto, con resumen, desviaciones y lecciones aprendidas, es el…', options: ['Informe de compleción de pruebas', 'Informe de avance de pruebas', 'Plan de pruebas', 'Informe de defectos'], answer: 'Informe de compleción de pruebas' },
      ].map(it => ({ cols: 2, ...it }));
      quiz(root, { items }, done);
    },
  });
})();
