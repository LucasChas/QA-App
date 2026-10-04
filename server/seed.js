'use strict';
/* Datos iniciales: biblioteca de documentación y un examen de ejemplo (borrador). */
const crypto = require('node:crypto');

const DOCS = [
  // Temario y estándares
  { category: 'Temario y certificación', title: 'ISTQB CTFL v4.0 — Certified Tester Foundation Level', url: 'https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/', lang: 'en', description: 'Página oficial de la certificación: temario (syllabus), ejemplos de examen y notas de la versión 4.0.' },
  { category: 'Temario y certificación', title: 'Glosario ISTQB', url: 'https://glossary.istqb.org/', lang: 'es', description: 'Glosario oficial con los términos de testing; permite elegir el idioma español.' },
  { category: 'Temario y certificación', title: 'HASTQB — Hispanic America Software Testing Qualifications Board', url: 'https://www.hastqb.org/', lang: 'es', description: 'Junta latinoamericana de ISTQB: temarios traducidos al español y exámenes en la región.' },
  { category: 'Temario y certificación', title: 'SSTQB — Descargas (programas de estudio)', url: 'https://es.sstqb.com/downloads', lang: 'es', description: 'Junta española de ISTQB: programas de estudio y glosario en español.' },
  { category: 'Temario y certificación', title: 'Programa de estudio CTFL v4.0 en español (PDF)', url: 'https://www.hastqb.org/wp-content/uploads/2023/08/CTFL-V4.0-ES-PROGRAMA-DE-ESTUDIO-V001.02.pdf', lang: 'es', description: 'El temario oficial completo del nivel básico, traducido por SSTQB y HASTQB. Es la base de todos los juegos.' },
  { category: 'Temario y certificación', title: 'Examen de ejemplo CTFL v4.0 — Preguntas (PDF)', url: 'https://www.hastqb.org/wp-content/uploads/2023/08/CTFL-V4.0-ES-EJEMPLO-DE-EXAMEN-PREGUNTAS-MODELO-A-V001.00.pdf', lang: 'es', description: 'Examen modelo A oficial en español: 40 preguntas.' },
  { category: 'Temario y certificación', title: 'Examen de ejemplo CTFL v4.0 — Respuestas (PDF)', url: 'https://www.hastqb.org/wp-content/uploads/2023/08/CTFL-V4.0-ES-EJEMPLO-DE-EXAMEN-RESPUESTAS-MODELO-A-V001.00.pdf', lang: 'es', description: 'Respuestas justificadas del examen modelo A.' },
  { category: 'Temario y certificación', title: 'Herramientas HASTQB (materiales CTFL 4.0)', url: 'https://www.hastqb.org/herramientas/', lang: 'es', description: 'Materiales descargables en español de la junta latinoamericana.' },
  { category: 'Temario y certificación', title: 'ISO/IEC/IEEE 29119-1 — Conceptos generales de pruebas', url: 'https://www.iso.org/standard/81291.html', lang: 'en', description: 'Norma internacional de pruebas de software: conceptos y definiciones.' },
  { category: 'Temario y certificación', title: 'ISO/IEC 25010 — Modelo de calidad del producto', url: 'https://iso25000.com/index.php/normas-iso-25000/iso-25010', lang: 'es', description: 'Explicación en español de las características de calidad (funcional, rendimiento, usabilidad, seguridad…).' },
  // Estrategia y técnicas
  { category: 'Estrategia y técnicas', title: 'The Practical Test Pyramid — Ham Vocke', url: 'https://martinfowler.com/articles/practical-test-pyramid.html', lang: 'en', description: 'Artículo de referencia sobre la pirámide de pruebas con ejemplos de código reales.' },
  { category: 'Estrategia y técnicas', title: 'Using the Agile Testing Quadrants — Lisa Crispin', url: 'https://lisacrispin.com/2011/11/08/using-the-agile-testing-quadrants/', lang: 'en', description: 'Cómo usar los cuadrantes de pruebas ágiles para planificar.' },
  { category: 'Estrategia y técnicas', title: 'Session-Based Test Management — Jonathan y James Bach', url: 'https://www.satisfice.com/download/session-based-test-management', lang: 'en', description: 'El artículo original sobre pruebas exploratorias basadas en sesiones (charters).' },
  { category: 'Estrategia y técnicas', title: 'Heuristic Test Strategy Model — James Bach', url: 'https://www.satisfice.com/download/heuristic-test-strategy-model', lang: 'en', description: 'Modelo heurístico para diseñar estrategias de prueba.' },
  { category: 'Estrategia y técnicas', title: 'Test Driven Development — Martin Fowler', url: 'https://martinfowler.com/bliki/TestDrivenDevelopment.html', lang: 'en', description: 'Introducción breve a TDD y el ciclo rojo-verde-refactor.' },
  { category: 'Estrategia y técnicas', title: 'Given When Then — Martin Fowler', url: 'https://martinfowler.com/bliki/GivenWhenThen.html', lang: 'en', description: 'Origen y uso del formato Dado/Cuando/Entonces en BDD.' },
  // Herramientas
  { category: 'Herramientas', title: 'Referencia de Gherkin — Cucumber', url: 'https://cucumber.io/docs/gherkin/reference/', lang: 'en', description: 'Sintaxis de Gherkin para escribir escenarios BDD.' },
  { category: 'Herramientas', title: 'Playwright — Documentación', url: 'https://playwright.dev/docs/intro', lang: 'en', description: 'Automatización de pruebas end-to-end para aplicaciones web.' },
  { category: 'Herramientas', title: 'Selenium — Documentación', url: 'https://www.selenium.dev/documentation/', lang: 'en', description: 'Automatización de navegadores con WebDriver.' },
  { category: 'Herramientas', title: 'Postman Learning Center', url: 'https://learning.postman.com/docs/introduction/overview/', lang: 'en', description: 'Pruebas de APIs: colecciones, scripts de prueba y automatización.' },
  { category: 'Herramientas', title: 'Apache JMeter — Manual de usuario', url: 'https://jmeter.apache.org/usermanual/index.html', lang: 'en', description: 'Pruebas de carga y rendimiento.' },
  { category: 'Herramientas', title: 'Grafana k6 — Documentación', url: 'https://grafana.com/docs/k6/latest/', lang: 'en', description: 'Pruebas de carga escritas en JavaScript.' },
  // Calidad no funcional
  { category: 'Seguridad y accesibilidad', title: 'OWASP Web Security Testing Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/', lang: 'en', description: 'Guía de referencia para pruebas de seguridad de aplicaciones web.' },
  { category: 'Seguridad y accesibilidad', title: 'WCAG 2.2 — Pautas de accesibilidad', url: 'https://www.w3.org/TR/WCAG22/', lang: 'en', description: 'Criterios de accesibilidad del W3C, base para pruebas de accesibilidad.' },
  { category: 'Seguridad y accesibilidad', title: 'Pruebas entre navegadores — MDN', url: 'https://developer.mozilla.org/es/docs/Learn_web_development/Extensions/Testing', lang: 'es', description: 'Guía de Mozilla sobre pruebas de compatibilidad y accesibilidad en distintos navegadores.' },
  // Comunidad
  { category: 'Comunidad', title: 'Ministry of Testing', url: 'https://www.ministryoftesting.com/', lang: 'en', description: 'Comunidad internacional de testers: artículos, cursos y eventos.' },
  { category: 'Comunidad', title: 'Google Testing Blog', url: 'https://testing.googleblog.com/', lang: 'en', description: 'Experiencias y prácticas de testing de los equipos de Google.' },
];

function seedDocs() {
  return DOCS.map(d => ({ id: crypto.randomUUID(), ...d, addedBy: null, createdAt: new Date().toISOString() }));
}

function seedExam() {
  const q = (text, options, answer, explain) => ({ id: crypto.randomUUID(), q: text, options, answer, explain });
  return {
    id: crypto.randomUUID(),
    title: 'Diagnóstico inicial de testing',
    description: 'Examen de ejemplo para conocer el nivel del grupo. Edítalo o publícalo cuando quieras.',
    timeLimit: 10,
    passPct: 60,
    attemptsAllowed: 1,
    showAnswers: true,
    published: false,
    assignedTo: 'all',
    dueDate: null,
    createdBy: null,
    createdAt: new Date().toISOString(),
    questions: [
      q('¿Qué es un defecto?', ['Una equivocación humana', 'Una imperfección en un producto de trabajo', 'Un evento observado al ejecutar el sistema', 'La causa raíz de un problema'], 1, 'Error → defecto → fallo.'),
      q('¿Qué principio dice que no se puede probar todo?', ['Agrupación de defectos', 'Pruebas exhaustivas imposibles', 'Pruebas tempranas', 'Dependen del contexto'], 1, ''),
      q('Un campo acepta 1 a 100. ¿Qué valores corresponden a BVA de 2 valores?', ['0, 1, 100, 101', '1, 50, 100', '0, 50, 101', '1, 2, 99, 100'], 0, 'El límite y su vecino en la partición adyacente.'),
      q('¿Qué tipo de prueba verifica que un defecto fue corregido?', ['Regresión', 'Confirmación', 'Humo', 'Aceptación'], 1, ''),
      q('Las revisiones de requisitos son un ejemplo de…', ['Pruebas dinámicas', 'Pruebas estáticas', 'Pruebas de rendimiento', 'Pruebas de componente'], 1, ''),
    ],
  };
}

module.exports = { seedDocs, seedExam, DOCS };
