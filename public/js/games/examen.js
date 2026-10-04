/* Simulacro de examen CTFL: preguntas aleatorias de todos los capítulos, con tiempo. */
(() => {

  QA.registerGame({
    id: 'examen',
    chapter: 6,
    icon: 'graduation',
    title: 'Simulacro de examen CTFL',
    desc: '20 preguntas aleatorias de todo el temario con tiempo límite. Se aprueba con 65%.',
    xp: 250,
    theory: `
      El examen real de ISTQB CTFL v4.0 tiene <b>40 preguntas</b> de opción múltiple, dura <b>60 minutos</b> (75 si no es en tu idioma nativo) y se aprueba con <b>26 respuestas correctas (65%)</b>.
      Este simulacro tiene 20 preguntas y 25 minutos. ¡Lee con atención cada opción!`,
    play(root, done) {
      QA.quiz(root, {
        items: QA.questionBank.map(it => ({ ...it, cols: 1 })),
        limit: 20,
        forceShuffle: true,
        timer: 25 * 60,
      }, (score, max) => done(score, max, {
        note: score / max >= 0.65 ? '¡Aprobado! Estás preparado para el examen real.' : 'No alcanzaste el 65%. Repasa los capítulos con menos estrellas.',
      }));
    },
  });
})();
