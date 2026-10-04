/* Capítulo 2 - Testing a lo largo del ciclo de vida del desarrollo */
(() => {
  const { quiz } = QA;

  QA.registerGame({
    id: 'niveles-prueba',
    chapter: 2,
    icon: '🏗️',
    title: 'Sube los niveles de prueba',
    desc: 'Identifica el nivel de prueba adecuado para cada escenario.',
    xp: 110,
    theory: `
      <ul>
        <li><b>Componente (unitarias):</b> componentes aislados, normalmente por desarrolladores, a menudo con stubs/drivers.</li>
        <li><b>Integración de componentes:</b> interfaces e interacciones entre componentes.</li>
        <li><b>Sistema:</b> comportamiento global del sistema completo (funcional y no funcional), normalmente por un equipo de pruebas independiente.</li>
        <li><b>Integración de sistemas:</b> interfaces con otros sistemas y servicios externos.</li>
        <li><b>Aceptación:</b> validación y disposición para el despliegue: UAT (usuario), operacional, contractual/regulatoria, alfa y beta.</li>
      </ul>`,
    play(root, done) {
      const L = ['Componente', 'Integración de componentes', 'Sistema', 'Integración de sistemas', 'Aceptación'];
      const items = [
        { q: 'Un desarrollador prueba la función <code>calcularIVA()</code> de forma aislada usando un framework xUnit.', answer: 'Componente', explain: 'Se prueba una unidad aislada; típicamente lo hace el desarrollador.' },
        { q: 'Se verifica que el módulo de carrito pase correctamente los datos al módulo de cálculo de envíos.', answer: 'Integración de componentes', explain: 'Se prueban las interfaces entre componentes del mismo sistema.' },
        { q: 'Se comprueba que la tienda online se comunica correctamente con la pasarela de pago de un proveedor externo.', answer: 'Integración de sistemas', explain: 'La interfaz es con un sistema externo, no entre componentes internos.' },
        { q: 'El equipo de QA ejecuta pruebas extremo a extremo del flujo de compra completo en un entorno similar a producción.', answer: 'Sistema', explain: 'Se evalúa el comportamiento del sistema completo frente a su especificación.' },
        { q: 'Usuarios del área de contabilidad verifican que el nuevo sistema les permite cerrar el mes como lo necesitan.', answer: 'Aceptación', explain: 'Es una prueba de aceptación de usuario (UAT): validación de necesidades.' },
        { q: 'Los administradores de sistemas prueban los procedimientos de backup, restauración y recuperación ante desastres.', answer: 'Aceptación', explain: 'Es una prueba de aceptación operacional (OAT).' },
        { q: 'Se usa un <i>stub</i> que simula la base de datos para probar la lógica de validación de un formulario.', answer: 'Componente', explain: 'Stubs y drivers son típicos para aislar componentes.' },
        { q: 'Un grupo de clientes externos usa una versión previa del producto en sus propias oficinas y reporta problemas.', answer: 'Aceptación', explain: 'Es una prueba beta (aceptación en el entorno del cliente).' },
        { q: 'Se mide el tiempo de respuesta del sistema completo con 1.000 usuarios concurrentes antes de salir a producción.', answer: 'Sistema', explain: 'Las pruebas no funcionales como rendimiento suelen hacerse a nivel de sistema.' },
        { q: 'Se verifica que el microservicio de usuarios responde con el contrato esperado al microservicio de pedidos.', answer: 'Integración de componentes', explain: 'Interacción entre componentes (servicios) del mismo sistema.' },
        { q: 'Se verifica que el software cumple una normativa legal de protección de datos.', answer: 'Aceptación', explain: 'Es una prueba de aceptación regulatoria.' },
      ].map(it => ({ ...it, options: L, cols: 2 }));
      quiz(root, { items, limit: 10, keepOrder: true }, done);
    },
  });

  QA.registerGame({
    id: 'tipos-prueba',
    chapter: 2,
    icon: '🧪',
    title: 'Tipos de prueba',
    desc: 'Funcional, no funcional, caja blanca, confirmación o regresión: ¿cuál es cuál?',
    xp: 110,
    theory: `
      <ul>
        <li><b>Funcionales:</b> evalúan <i>qué</i> hace el sistema (completitud, corrección, adecuación).</li>
        <li><b>No funcionales:</b> evalúan <i>cómo de bien</i> lo hace: rendimiento, usabilidad, seguridad, fiabilidad, compatibilidad, mantenibilidad, portabilidad (ISO 25010).</li>
        <li><b>Caja negra:</b> basadas en la especificación. <b>Caja blanca:</b> basadas en la estructura interna (código, arquitectura).</li>
        <li><b>Confirmación (re-test):</b> verifica que un defecto fue corregido.</li>
        <li><b>Regresión:</b> verifica que un cambio no rompió nada que antes funcionaba. ¡Ideal para automatizar!</li>
      </ul>`,
    play(root, done) {
      const T = ['Funcional', 'No funcional', 'Caja blanca', 'Confirmación', 'Regresión'];
      const items = [
        { q: 'Se comprueba que al aplicar el cupón "VERANO" se descuenta un 15% del total.', answer: 'Funcional', explain: 'Verifica lo que el sistema hace (una regla de negocio).' },
        { q: 'Se mide que la página de inicio cargue en menos de 2 segundos en una conexión 4G.', answer: 'No funcional', explain: 'Eficiencia de desempeño (rendimiento): cómo de bien lo hace.' },
        { q: 'Se diseñan pruebas para asegurar que todas las ramas del <code>if/else</code> de la función de descuentos se ejecuten.', answer: 'Caja blanca', explain: 'Se basa en la estructura interna del código (cobertura de ramas).' },
        { q: 'Tras corregir el bug #482, el tester ejecuta exactamente los pasos que lo reproducían.', answer: 'Confirmación', explain: 'Confirma que el defecto específico fue corregido.' },
        { q: 'Después de actualizar la librería de fechas, se re-ejecuta la suite automatizada completa del módulo de reservas.', answer: 'Regresión', explain: 'Busca efectos secundarios no deseados del cambio en partes que antes funcionaban.' },
        { q: 'Se evalúa si usuarios nuevos logran completar el registro sin ayuda en menos de 3 minutos.', answer: 'No funcional', explain: 'Usabilidad: característica de calidad no funcional.' },
        { q: 'Se intenta una inyección SQL en el campo de búsqueda.', answer: 'No funcional', explain: 'Seguridad: característica no funcional según ISO/IEC 25010.' },
        { q: 'Se valida que el sistema emita la factura con los datos fiscales correctos del cliente.', answer: 'Funcional', explain: 'Corrección funcional del resultado.' },
        { q: 'El parche de seguridad se aplica en producción y se ejecutan pruebas para garantizar que las funcionalidades existentes siguen operando.', answer: 'Regresión', explain: 'Es parte de las pruebas de mantenimiento: regresión tras un cambio.' },
        { q: 'Se verifica que la app funcione en Chrome, Firefox y Safari.', answer: 'No funcional', explain: 'Compatibilidad / portabilidad: no funcional.' },
      ].map(it => ({ ...it, options: T, cols: 2 }));
      quiz(root, { items, keepOrder: true }, done);
    },
  });

  QA.registerGame({
    id: 'sdlc-shift-left',
    chapter: 2,
    icon: '⏪',
    title: 'Shift-left y modelos de desarrollo',
    desc: 'TDD, BDD, ATDD, DevOps, retrospectivas y pruebas de mantenimiento.',
    xp: 100,
    theory: `
      <ul>
        <li><b>Buenas prácticas:</b> para cada actividad de desarrollo hay una actividad de prueba; cada nivel tiene objetivos propios; el análisis y diseño de pruebas empieza en la fase correspondiente; los testers revisan borradores lo antes posible.</li>
        <li><b>TDD:</b> primero se escribe la prueba (unitaria), luego el código. <b>ATDD:</b> pruebas derivadas de criterios de aceptación antes de desarrollar. <b>BDD:</b> comportamiento en lenguaje natural (Dado/Cuando/Entonces).</li>
        <li><b>DevOps:</b> integración y entrega continuas (CI/CD), feedback rápido y regresión automatizada.</li>
        <li><b>Shift-left:</b> probar antes en el ciclo de vida (revisiones, pruebas estáticas, TDD…).</li>
        <li><b>Retrospectivas:</b> reflexionar sobre qué funcionó y qué mejorar.</li>
      </ul>`,
    play(root, done) {
      const items = [
        { q: 'El desarrollador escribe una prueba que falla, luego escribe el código mínimo para que pase y finalmente refactoriza.', options: ['TDD', 'ATDD', 'BDD', 'DevOps'], answer: 'TDD', explain: 'Ciclo rojo → verde → refactor de Test-Driven Development.' },
        { q: '<pre class="code">Dado que tengo 2 productos en el carrito\nCuando aplico el cupón "QA10"\nEntonces el total se reduce un 10%</pre>¿Qué enfoque usa este formato?', options: ['TDD', 'BDD', 'Pruebas de caja blanca', 'Pruebas de componente'], answer: 'BDD', explain: 'Behavior-Driven Development usa Gherkin: Dado / Cuando / Entonces.' },
        { q: 'Antes de empezar una historia, el equipo (negocio, desarrollo y QA) escribe pruebas a partir de los criterios de aceptación.', options: ['TDD', 'ATDD', 'Pruebas exploratorias', 'Pruebas de regresión'], answer: 'ATDD', explain: 'Acceptance Test-Driven Development: pruebas derivadas de los criterios de aceptación, antes del código.' },
        { q: 'Cada commit dispara un pipeline que compila, ejecuta pruebas automatizadas y despliega en un entorno de staging.', options: ['DevOps / CI-CD', 'Modelo en cascada', 'Pruebas de aceptación operacional', 'Revisión informal'], answer: 'DevOps / CI-CD', explain: 'DevOps promueve integración y entrega continuas con feedback rápido.' },
        { q: '¿Cuál de estas es una práctica de <b>shift-left</b>?', options: ['Revisar los requisitos antes de codificar', 'Probar solo cuando el sistema esté completo', 'Dejar las pruebas de rendimiento para después del release', 'Ejecutar solo pruebas de aceptación'], answer: 'Revisar los requisitos antes de codificar', explain: 'Shift-left = mover las pruebas hacia etapas más tempranas.' },
        { q: 'En un modelo secuencial (cascada / V), ¿cuándo debería empezar el diseño de las pruebas de sistema?', options: ['Cuando estén disponibles las especificaciones del sistema', 'Cuando el código esté terminado', 'Después de las pruebas de aceptación', 'Nunca, se hacen exploratorias'], answer: 'Cuando estén disponibles las especificaciones del sistema', explain: 'Buena práctica: el análisis y diseño de pruebas de cada nivel comienza en la fase de desarrollo correspondiente.' },
        { q: 'Una empresa migra su sistema de un servidor local a la nube. ¿Qué tipo de pruebas se necesitan?', options: ['Pruebas de mantenimiento', 'Solo pruebas de componente', 'No se necesitan pruebas', 'Solo pruebas alfa'], answer: 'Pruebas de mantenimiento', explain: 'Las migraciones, modificaciones y retiros de sistemas disparan pruebas de mantenimiento (incluida regresión).' },
        { q: 'Al final del sprint, el equipo se reúne para discutir qué funcionó bien en las pruebas y qué mejorar. ¿Cómo se llama?', options: ['Retrospectiva', 'Planificación del sprint', 'Inspección', 'Daily'], answer: 'Retrospectiva', explain: 'Las retrospectivas impulsan la mejora continua, incluida la del proceso de pruebas.' },
        { q: 'Un análisis de impacto en pruebas de mantenimiento sirve para…', options: ['Identificar las consecuencias de un cambio y decidir qué regresión ejecutar', 'Medir el rendimiento del sistema', 'Estimar el salario del equipo', 'Reemplazar las pruebas de confirmación'], answer: 'Identificar las consecuencias de un cambio y decidir qué regresión ejecutar', explain: 'El análisis de impacto evalúa qué partes se ven afectadas por un cambio.' },
      ];
      quiz(root, { items }, done);
    },
  });
})();
