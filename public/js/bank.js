/* Banco de preguntas tipo examen CTFL, etiquetadas por capítulo.
   Lo usan el simulacro de examen y el editor de exámenes del profesor. */
(() => {
  const BANK = [
    // Capítulo 1
    { ch: 1, q: '¿Cuál es la mejor descripción de un <b>fallo</b>?', options: ['Un evento en el que el sistema no realiza la función requerida', 'Una equivocación humana', 'Una imperfección en el código', 'La causa fundamental de un problema'], answer: 'Un evento en el que el sistema no realiza la función requerida' },
    { ch: 1, q: 'Un equipo ejecuta la misma suite durante años sin encontrar defectos nuevos. ¿Qué principio describe esto?', options: ['Las pruebas se desgastan', 'Agrupación de defectos', 'Pruebas tempranas', 'Dependen del contexto'], answer: 'Las pruebas se desgastan' },
    { ch: 1, q: '¿Qué actividad del proceso de prueba responde a la pregunta "¿qué probar?"', options: ['Análisis de pruebas', 'Diseño de pruebas', 'Implementación de pruebas', 'Ejecución de pruebas'], answer: 'Análisis de pruebas' },
    { ch: 1, q: '¿Qué es el <b>testware</b>?', options: ['Los productos de trabajo generados por las pruebas (casos, datos, scripts, informes)', 'Una herramienta de automatización', 'El hardware del entorno de pruebas', 'Un tipo de malware'], answer: 'Los productos de trabajo generados por las pruebas (casos, datos, scripts, informes)' },
    { ch: 1, q: 'La <b>trazabilidad</b> entre la base de prueba y el testware permite…', options: ['Evaluar la cobertura y el impacto de los cambios', 'Eliminar la necesidad de revisiones', 'Ejecutar pruebas más rápido', 'Evitar los defectos'], answer: 'Evaluar la cobertura y el impacto de los cambios' },
    { ch: 1, q: '¿Qué afirmación sobre testing y depuración es correcta?', options: ['El testing puede provocar fallos; la depuración encuentra, analiza y elimina sus causas', 'Son la misma actividad', 'La depuración siempre la hacen los testers', 'El testing corrige defectos'], answer: 'El testing puede provocar fallos; la depuración encuentra, analiza y elimina sus causas' },
    { ch: 1, q: '¿Cuál es una habilidad genérica importante de un tester?', options: ['Pensamiento crítico y atención al detalle', 'Evitar la comunicación con desarrollo', 'Programar en un único lenguaje', 'Dar por hecho los requisitos'], answer: 'Pensamiento crítico y atención al detalle' },
    // Capítulo 2
    { ch: 2, q: '¿En qué nivel de prueba se suelen usar <i>stubs</i> y <i>drivers</i>?', options: ['Componente', 'Aceptación', 'Integración de sistemas', 'Beta'], answer: 'Componente' },
    { ch: 2, q: 'Las pruebas de regresión se realizan para…', options: ['Detectar efectos secundarios no deseados de un cambio', 'Confirmar que un defecto específico fue corregido', 'Medir el rendimiento', 'Validar la usabilidad'], answer: 'Detectar efectos secundarios no deseados de un cambio' },
    { ch: 2, q: '¿Qué característica es <b>no funcional</b>?', options: ['Rendimiento', 'Cálculo correcto del IVA', 'Registro de usuarios', 'Generación de facturas'], answer: 'Rendimiento' },
    { ch: 2, q: '¿Cuál de estos dispara pruebas de mantenimiento?', options: ['La migración de una plataforma a otra', 'El diseño inicial del sistema', 'La redacción de requisitos', 'La contratación de testers'], answer: 'La migración de una plataforma a otra' },
    { ch: 2, q: 'En TDD, ¿qué se escribe primero?', options: ['La prueba', 'El código de producción', 'La documentación', 'El manual de usuario'], answer: 'La prueba' },
    { ch: 2, q: 'Las pruebas alfa y beta son formas de…', options: ['Pruebas de aceptación', 'Pruebas de componente', 'Pruebas estáticas', 'Pruebas de caja blanca'], answer: 'Pruebas de aceptación' },
    // Capítulo 3
    { ch: 3, q: '¿Qué defecto es más fácil de encontrar con pruebas estáticas que con dinámicas?', options: ['Requisitos ambiguos o contradictorios', 'Tiempos de respuesta lentos', 'Fugas de memoria en ejecución', 'Fallos de integración en producción'], answer: 'Requisitos ambiguos o contradictorios' },
    { ch: 3, q: '¿Cuál es el tipo de revisión más formal?', options: ['Inspección', 'Recorrido', 'Revisión técnica', 'Revisión informal'], answer: 'Inspección' },
    { ch: 3, q: 'En una revisión, ¿quién registra las anomalías y decisiones?', options: ['Escriba', 'Autor', 'Gerente', 'Revisor'], answer: 'Escriba' },
    { ch: 3, q: '¿Qué beneficio aporta la retroalimentación temprana y frecuente de los stakeholders?', options: ['Evita malentendidos sobre los requisitos y reduce el retrabajo', 'Elimina la necesidad de pruebas', 'Aumenta el número de defectos', 'Retrasa la entrega'], answer: 'Evita malentendidos sobre los requisitos y reduce el retrabajo' },
    // Capítulo 4
    { ch: 4, q: 'Un campo acepta enteros de 10 a 20. Según BVA de 2 valores, ¿qué conjunto es correcto?', options: ['9, 10, 20, 21', '10, 15, 20', '9, 10, 11, 19, 20, 21', '0, 10, 20, 30'], answer: '9, 10, 20, 21' },
    { ch: 4, q: 'Un campo acepta enteros de 10 a 20. Según BVA de 3 valores, ¿qué conjunto es correcto?', options: ['9, 10, 11, 19, 20, 21', '9, 10, 20, 21', '10, 20', '9, 21'], answer: '9, 10, 11, 19, 20, 21' },
    { ch: 4, q: 'Una regla de negocio con 3 condiciones booleanas genera, en una tabla de decisión completa…', options: ['8 reglas', '3 reglas', '6 reglas', '9 reglas'], answer: '8 reglas' },
    { ch: 4, q: '¿Qué técnica es más adecuada para un sistema cuyo comportamiento depende de su historia (p. ej. un cajero automático)?', options: ['Transición de estados', 'Particiones de equivalencia', 'Cobertura de sentencias', 'Listas de comprobación'], answer: 'Transición de estados' },
    { ch: 4, q: '¿Qué afirmación sobre la cobertura de código es correcta?', options: ['100% de cobertura de ramas implica 100% de cobertura de sentencias', '100% de cobertura de sentencias implica 100% de cobertura de ramas', 'La cobertura de sentencias mide decisiones', 'Son técnicas de caja negra'], answer: '100% de cobertura de ramas implica 100% de cobertura de sentencias' },
    { ch: 4, q: 'Las pruebas exploratorias son especialmente útiles cuando…', options: ['Hay poca especificación o presión de tiempo', 'Existe una regulación que exige trazabilidad completa', 'Se necesitan pruebas totalmente repetibles', 'No hay testers con experiencia'], answer: 'Hay poca especificación o presión de tiempo' },
    { ch: 4, q: 'La técnica de "ataques de fallos" (fault attacks) es una forma de…', options: ['Predicción de errores', 'Tabla de decisión', 'Cobertura de ramas', 'Revisión técnica'], answer: 'Predicción de errores' },
    { ch: 4, q: 'Un campo "porcentaje" acepta 0 a 100. Se probaron -5 y 50. ¿Cobertura de particiones de equivalencia?', options: ['67%', '33%', '50%', '100%'], answer: '67%' },
    // Capítulo 5
    { ch: 5, q: 'Nivel de riesgo se determina por…', options: ['Probabilidad e impacto', 'Costo y tiempo', 'Número de testers', 'Cantidad de requisitos'], answer: 'Probabilidad e impacto' },
    { ch: 5, q: '"El proveedor puede entregar tarde la API" es un riesgo de…', options: ['Proyecto', 'Producto', 'Calidad', 'Usabilidad'], answer: 'Proyecto' },
    { ch: 5, q: 'Estimación de tres puntos: a = 2, m = 5, b = 14. ¿Resultado?', options: ['6', '5', '7', '21'], answer: '6' },
    { ch: 5, q: '¿Qué elemento NO suele formar parte de un informe de defecto?', options: ['El salario del desarrollador responsable', 'Pasos para reproducir', 'Resultado esperado y real', 'Severidad'], answer: 'El salario del desarrollador responsable' },
    { ch: 5, q: 'Los criterios de salida se usan para…', options: ['Decidir cuándo terminar una actividad de prueba', 'Decidir cuándo empezar a programar', 'Asignar defectos a desarrolladores', 'Elegir la herramienta de automatización'], answer: 'Decidir cuándo terminar una actividad de prueba' },
    { ch: 5, q: 'En la pirámide de pruebas, las pruebas de la cima son…', options: ['Pocas, lentas y de alto nivel (end-to-end)', 'Muchas, rápidas y aisladas', 'Siempre manuales', 'Pruebas estáticas'], answer: 'Pocas, lentas y de alto nivel (end-to-end)' },
    { ch: 5, q: 'Las pruebas de rendimiento y seguridad pertenecen al cuadrante de pruebas ágiles…', options: ['Q4: orientadas a la tecnología, critican el producto', 'Q1: orientadas a la tecnología, apoyan al equipo', 'Q2: orientadas al negocio, apoyan al equipo', 'Q3: orientadas al negocio, critican el producto'], answer: 'Q4: orientadas a la tecnología, critican el producto' },
    // Capítulo 6
    { ch: 6, q: '¿Cuál es un beneficio de la automatización de pruebas?', options: ['Reducción del trabajo manual repetitivo', 'Elimina la necesidad de mantenimiento', 'Garantiza la ausencia de defectos', 'Sustituye a los testers por completo'], answer: 'Reducción del trabajo manual repetitivo' },
    { ch: 6, q: '¿Cuál es un riesgo de la automatización?', options: ['Subestimar el esfuerzo de mantenimiento de los scripts', 'Mayor repetibilidad', 'Feedback más rápido', 'Medición objetiva de la cobertura'], answer: 'Subestimar el esfuerzo de mantenimiento de los scripts' },
  ];

  QA.questionBank = BANK;
})();
