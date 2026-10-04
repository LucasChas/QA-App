/* Capítulo 1 - Fundamentos del testing */
(() => {
  const { quiz, order, phases } = QA;

  QA.registerGame({
    id: 'error-defecto-fallo',
    chapter: 1,
    icon: 'link',
    title: '¿Error, defecto o fallo?',
    desc: 'Clasifica cada situación según la cadena causa → efecto del ISTQB.',
    xp: 100,
    theory: `
      <ul>
        <li><b>Error (equivocación):</b> acción humana que produce un resultado incorrecto. Ej.: un desarrollador entiende mal un requisito.</li>
        <li><b>Defecto (bug, falta):</b> imperfección en un producto de trabajo (código, requisito, diseño). Ej.: un <code>&lt;</code> en lugar de <code>&lt;=</code>.</li>
        <li><b>Fallo:</b> evento en el que el sistema no hace lo que debería al ejecutarse. Ej.: la app cobra mal al usuario.</li>
        <li><b>Causa raíz:</b> la razón fundamental por la que ocurrió el problema (p. ej. falta de formación, presión de tiempo).</li>
      </ul>
      Un error puede producir un defecto, y un defecto al ejecutarse puede provocar un fallo. ¡No todos los defectos producen fallos!`,
    play(root, done) {
      const opts = ['Error', 'Defecto', 'Fallo', 'Causa raíz'];
      const items = [
        { q: 'El analista interpretó que "cliente frecuente" significa más de 5 compras, cuando el negocio quería decir más de 5 compras <i>por mes</i>.', answer: 'Error', explain: 'Es la equivocación humana (malinterpretación) que origina el problema.' },
        { q: 'En el código aparece <code>if (edad > 18)</code> cuando el requisito dice "18 años o más".', answer: 'Defecto', explain: 'Es una imperfección en el producto de trabajo (el código). Aún no se ejecutó.' },
        { q: 'Un usuario de exactamente 18 años intenta registrarse y la aplicación le muestra "Debes ser mayor de edad".', answer: 'Fallo', explain: 'Es el comportamiento incorrecto observado al ejecutar el sistema.' },
        { q: 'El documento de requisitos dice en una sección que la contraseña tiene mínimo 8 caracteres y en otra que tiene mínimo 6.', answer: 'Defecto', explain: 'Una inconsistencia en un requisito es un defecto en un producto de trabajo (detectable con pruebas estáticas).' },
        { q: 'El equipo descubre que los errores de redondeo ocurren porque nadie del equipo había recibido formación sobre aritmética de punto flotante.', answer: 'Causa raíz', explain: 'La falta de conocimiento es la razón fundamental detrás del error humano.' },
        { q: 'Al pulsar "Pagar" la página se queda en blanco y el pedido no se registra.', answer: 'Fallo', explain: 'Se observa en ejecución: el sistema no realiza la función esperada.' },
        { q: 'El programador, cansado tras una jornada de 12 horas, olvidó manejar el caso de lista vacía.', answer: 'Error', explain: 'El olvido es la acción humana equivocada. La presión/cansancio sería la causa raíz.' },
        { q: 'Una consulta SQL tiene un JOIN incorrecto en un módulo que nunca se ejecuta en producción.', answer: 'Defecto', explain: 'Existe el defecto, pero como nunca se ejecuta, no provoca fallos. Los defectos no siempre se manifiestan.' },
        { q: 'Los plazos irreales impuestos por la gerencia hicieron que se saltaran las revisiones de código.', answer: 'Causa raíz', explain: 'La presión de tiempo es un factor organizacional que origina errores: es una causa raíz.' },
        { q: 'El cajero automático entrega $100 cuando el cliente solicitó $1000.', answer: 'Fallo', explain: 'Comportamiento incorrecto observable del sistema en funcionamiento.' },
        { q: 'El diseñador de la base de datos definió el campo "teléfono" como numérico, perdiendo los ceros iniciales.', answer: 'Defecto', explain: 'El modelo de datos (producto de trabajo) contiene una imperfección.' },
      ].map(it => ({ ...it, options: opts, cols: 2 }));
      quiz(root, { items, limit: 10, keepOrder: true }, done);
    },
  });

  QA.registerGame({
    id: 'siete-principios',
    chapter: 1,
    icon: 'scroll',
    title: 'Los 7 principios',
    desc: 'Relaciona situaciones reales con los principios del testing.',
    xp: 120,
    theory: `
      <ol>
        <li><b>Las pruebas muestran la presencia, no la ausencia de defectos.</b></li>
        <li><b>Las pruebas exhaustivas son imposibles</b> (salvo casos triviales): hay que priorizar.</li>
        <li><b>Las pruebas tempranas ahorran tiempo y dinero</b> (shift-left).</li>
        <li><b>Los defectos se agrupan</b>: pocos módulos concentran la mayoría de defectos (Pareto).</li>
        <li><b>Las pruebas se desgastan</b> (paradoja del pesticida): repetir las mismas pruebas deja de encontrar defectos nuevos.</li>
        <li><b>Las pruebas dependen del contexto</b>: no se prueba igual un videojuego que un marcapasos.</li>
        <li><b>Falacia de la ausencia de defectos</b>: un sistema sin defectos puede no satisfacer al usuario.</li>
      </ol>`,
    play(root, done) {
      const P = [
        'Presencia, no ausencia de defectos',
        'Pruebas exhaustivas imposibles',
        'Pruebas tempranas',
        'Agrupación de defectos',
        'Las pruebas se desgastan',
        'Dependen del contexto',
        'Falacia de ausencia de defectos',
      ];
      const items = [
        { q: 'El gerente dice: "Si ejecutamos los 500 casos y todos pasan, podemos garantizar que el sistema no tiene bugs".', answer: P[0], explain: 'Las pruebas reducen la probabilidad de defectos no descubiertos, pero no prueban que no existan.' },
        { q: 'Un formulario tiene 12 campos y cada uno acepta cientos de valores. El equipo decide usar técnicas y priorización basada en riesgo.', answer: P[1], explain: 'Probar todas las combinaciones es imposible; se usan técnicas y priorización.' },
        { q: 'El tester participa en el refinamiento de historias de usuario y detecta ambigüedades antes de que se escriba código.', answer: P[2], explain: 'Encontrar defectos temprano (en requisitos) es mucho más barato que corregirlos en producción.' },
        { q: 'El 80% de los defectos reportados en el último año provienen del módulo de facturación.', answer: P[3], explain: 'Los defectos tienden a concentrarse en pocos componentes. Útil para enfocar las pruebas basadas en riesgo.' },
        { q: 'La suite de regresión lleva 2 años sin cambios y hace meses que no detecta ningún defecto, pero los usuarios siguen reportando problemas.', answer: P[4], explain: 'Hay que revisar y actualizar las pruebas y los datos; quizás crear pruebas nuevas.' },
        { q: 'Para el software de un dispositivo médico se exige trazabilidad completa y cobertura de decisiones; para una app de recetas se usan pruebas exploratorias.', answer: P[5], explain: 'El enfoque de pruebas se adapta al dominio, al riesgo y a las regulaciones.' },
        { q: 'El sistema pasó todas las pruebas sin defectos abiertos, pero los usuarios lo rechazan porque no resuelve su problema real.', answer: P[6], explain: 'Además de verificar, hay que validar que el sistema satisface las necesidades del usuario.' },
        { q: 'Después de corregir muchos defectos, el equipo agrega nuevos datos de prueba y variaciones a las pruebas automatizadas existentes.', answer: P[4], explain: 'Modificar las pruebas evita el "desgaste". Ojo: en regresión, que no cambien los resultados puede ser algo bueno.' },
        { q: 'Un banco aplica pruebas de seguridad exhaustivas, mientras una startup de memes prioriza la velocidad de entrega.', answer: P[5], explain: 'Distintos contextos implican distintos riesgos y enfoques de prueba.' },
        { q: 'Revisar el diseño de la arquitectura antes de implementar evitó un rediseño costoso.', answer: P[2], explain: 'Las pruebas estáticas tempranas evitan que los defectos se propaguen a fases posteriores.' },
      ].map(it => ({ ...it, options: P, cols: 2 }));
      quiz(root, { items, limit: 9, keepOrder: true }, done);
    },
  });

  QA.registerGame({
    id: 'proceso-pruebas',
    chapter: 1,
    icon: 'cycle',
    title: 'El proceso de prueba',
    desc: 'Ordena las actividades del proceso y relaciona cada una con su producto de prueba (testware).',
    xp: 130,
    theory: `
      El proceso de prueba del ISTQB incluye estas actividades (pueden ser iterativas y solaparse):
      <ul>
        <li><b>Planificación:</b> objetivos, enfoque, recursos, calendario → <i>plan de pruebas</i>.</li>
        <li><b>Monitoreo y control:</b> continua; compara el avance con el plan → <i>informes de avance</i>.</li>
        <li><b>Análisis:</b> "¿qué probar?" a partir de la base de prueba → <i>condiciones de prueba</i>.</li>
        <li><b>Diseño:</b> "¿cómo probar?" → <i>casos de prueba</i>, datos requeridos, cobertura.</li>
        <li><b>Implementación:</b> preparar lo necesario → <i>procedimientos/suites, datos, entorno</i>.</li>
        <li><b>Ejecución:</b> correr las pruebas y comparar resultados → <i>registros e informes de defectos</i>.</li>
        <li><b>Compleción (cierre):</b> lecciones aprendidas, archivar testware → <i>informe de compleción</i>.</li>
      </ul>`,
    play(root, done) {
      phases(root, [
        (r, d) => order(r, {
          title: 'Ordena las actividades principales del proceso de prueba',
          instructions: 'El monitoreo y control ocurre en paralelo durante todo el proceso, por eso no está en la lista.',
          items: ['Planificación', 'Análisis', 'Diseño', 'Implementación', 'Ejecución', 'Compleción'],
          explain: 'Análisis responde "qué probar"; diseño responde "cómo probar"; implementación prepara todo para ejecutar.',
        }, d),
        (r, d) => {
          const A = ['Planificación', 'Monitoreo y control', 'Análisis', 'Diseño', 'Implementación', 'Ejecución', 'Compleción'];
          const items = [
            { q: '¿En qué actividad se producen las <b>condiciones de prueba</b> priorizadas?', answer: 'Análisis' },
            { q: '¿En qué actividad se crean los <b>casos de prueba</b> de alto nivel y se identifican los datos necesarios?', answer: 'Diseño' },
            { q: '¿En qué actividad se arman las <b>suites y procedimientos de prueba</b>, y se prepara el entorno?', answer: 'Implementación' },
            { q: '¿En qué actividad se generan los <b>registros de prueba</b> y los <b>informes de defectos</b>?', answer: 'Ejecución' },
            { q: '¿En qué actividad se elabora el <b>informe de compleción</b> y se archivan las lecciones aprendidas?', answer: 'Compleción' },
            { q: '¿En qué actividad se definen los <b>objetivos</b>, el enfoque y los <b>criterios de entrada y salida</b>?', answer: 'Planificación' },
            { q: '¿Qué actividad genera los <b>informes de avance</b> y toma acciones correctivas si nos desviamos del plan?', answer: 'Monitoreo y control' },
          ].map(it => ({ ...it, options: A, cols: 2 }));
          quiz(r, { items, keepOrder: true }, d);
        },
      ], done);
    },
  });

  QA.registerGame({
    id: 'por-que-probar',
    chapter: 1,
    icon: 'help',
    title: 'QA, QC y depuración',
    desc: 'Diferencia testing, depuración, aseguramiento de calidad, verificación y validación.',
    xp: 90,
    theory: `
      <ul>
        <li><b>Testing vs. depuración:</b> el testing descubre fallos o defectos; la depuración (debugging) encuentra la causa, la corrige y verifica la corrección. La hacen normalmente los desarrolladores.</li>
        <li><b>QA (aseguramiento de calidad):</b> enfoque preventivo, orientado al <i>proceso</i>.</li>
        <li><b>QC (control de calidad):</b> enfoque correctivo, orientado al <i>producto</i>. El testing es una forma de QC.</li>
        <li><b>Verificación:</b> ¿construimos el producto correctamente? (cumple la especificación).</li>
        <li><b>Validación:</b> ¿construimos el producto correcto? (satisface las necesidades del usuario).</li>
      </ul>`,
    play(root, done) {
      const items = [
        { q: 'Un desarrollador reproduce un fallo, encuentra la línea de código responsable y la corrige. ¿Qué actividad es?', options: ['Testing', 'Depuración', 'QA', 'Validación'], answer: 'Depuración', explain: 'La depuración localiza, analiza y elimina la causa del fallo.' },
        { q: 'La empresa implementa una política de revisiones de código obligatorias y capacita a los equipos en buenas prácticas.', options: ['Aseguramiento de calidad (QA)', 'Control de calidad (QC)', 'Depuración', 'Pruebas de aceptación'], answer: 'Aseguramiento de calidad (QA)', explain: 'QA es preventivo y se enfoca en mejorar el proceso.' },
        { q: 'Un tester ejecuta casos de prueba sobre la nueva versión para detectar fallos antes del release.', options: ['Aseguramiento de calidad (QA)', 'Control de calidad (QC)', 'Depuración', 'Gestión de configuración'], answer: 'Control de calidad (QC)', explain: 'El testing es una forma de control de calidad: correctivo y orientado al producto.' },
        { q: 'Se comprueba que el sistema cumple exactamente lo indicado en la especificación de requisitos.', options: ['Verificación', 'Validación'], answer: 'Verificación', explain: 'Verificar = ¿construimos el producto correctamente según lo especificado?' },
        { q: 'Usuarios reales prueban la app para confirmar que les ayuda a completar su trabajo diario.', options: ['Verificación', 'Validación'], answer: 'Validación', explain: 'Validar = ¿construimos el producto correcto para las necesidades del usuario?' },
        { q: '¿Cuál de estos NO es un objetivo típico de las pruebas según el ISTQB?', options: ['Evaluar productos de trabajo', 'Provocar fallos y encontrar defectos', 'Demostrar que el software no tiene defectos', 'Reducir el nivel de riesgo de calidad'], answer: 'Demostrar que el software no tiene defectos', explain: 'Por el principio 1, las pruebas no pueden demostrar la ausencia de defectos.' },
        { q: 'Un tester vuelve a ejecutar la prueba que falló para comprobar que la corrección del desarrollador funciona. ¿Quién debería hacer esto?', options: ['Solo el desarrollador como parte de la depuración', 'Puede hacerlo el tester: es una prueba de confirmación', 'Nadie: si el desarrollador lo corrigió, no hace falta', 'El cliente final'], answer: 'Puede hacerlo el tester: es una prueba de confirmación', explain: 'Tras la depuración, las pruebas de confirmación verifican que el defecto se corrigió.' },
        { q: 'La principal ventaja de tener testers independientes es…', options: ['Que son más baratos', 'Que detectan otro tipo de fallos por tener sesgos distintos al autor', 'Que no necesitan comunicarse con desarrollo', 'Que eliminan la necesidad de pruebas unitarias'], answer: 'Que detectan otro tipo de fallos por tener sesgos distintos al autor', explain: 'La independencia aporta perspectivas diferentes. Desventaja: posible aislamiento del equipo.' },
      ];
      quiz(root, { items }, done);
    },
  });
})();
