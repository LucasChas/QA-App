/* QA Academy - shell de la aplicación, acceso (login/registro) y enrutador. */
(() => {
  const { h } = QA;
  const { icon, btn } = UI;
  const root = document.getElementById('root');
  let user = null;

  /* ---------- Tema (sistema / claro / oscuro) ---------- */
  const THEMES = ['system', 'light', 'dark'];
  const THEME_LABEL = { system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' };
  let theme = 'system';
  try { theme = localStorage.getItem('qa-theme') || 'system'; } catch (e) { /* sin almacenamiento */ }
  const applyTheme = () => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  };
  applyTheme();

  /* ---------- Acceso ---------- */
  function authScreen(status) {
    let mode = status.setup ? 'register' : 'login';
    const err = UI.errorBox();
    const formBox = h('div');

    function render() {
      err.clear();
      const isReg = mode === 'register';
      const name = h('input', { id: 'auth-name', class: 'input', autocomplete: 'name', required: true, maxlength: '80' });
      const email = h('input', { id: 'auth-email', class: 'input', type: 'email', autocomplete: 'email', required: true });
      const pw = h('input', { id: 'auth-pw', class: 'input', type: 'password', autocomplete: isReg ? 'new-password' : 'current-password', required: true, minlength: isReg ? '8' : null });
      const code = h('input', { id: 'auth-code', class: 'input', autocomplete: 'off' });
      const submit = btn(isReg ? 'Crear cuenta' : 'Ingresar', { variant: 'primary', type: 'submit' });

      const form = h('form', { class: 'form', onsubmit: async e => {
        e.preventDefault();
        err.clear();
        submit.disabled = true;
        try {
          const body = isReg
            ? { name: name.value, email: email.value, password: pw.value, ...(code.value ? { teacherCode: code.value } : {}) }
            : { email: email.value, password: pw.value };
          const r = await API.post(isReg ? '/api/auth/register' : '/api/auth/login', body);
          start(r.user, r.progress);
        } catch (ex) {
          err.show(ex.message);
          submit.disabled = false;
        }
      } },
        err.el,
        isReg ? UI.field('Nombre y apellido', name) : null,
        UI.field('Email', email),
        UI.field('Contraseña', pw, isReg ? 'Mínimo 8 caracteres.' : null),
        isReg && status.teacherCode && !status.setup ? h('details', { class: 'teacher-code' },
          h('summary', null, 'Soy profesor'),
          UI.field('Código de profesor', code, 'Te lo da quien administra la plataforma.')) : null,
        submit);

      formBox.replaceChildren(
        h('div', { class: 'tabs', role: 'tablist' },
          h('button', { role: 'tab', 'aria-selected': String(!isReg), class: !isReg ? 'active' : '', onclick: () => { mode = 'login'; render(); } }, 'Ingresar'),
          h('button', { role: 'tab', 'aria-selected': String(isReg), class: isReg ? 'active' : '', onclick: () => { mode = 'register'; render(); } }, 'Crear cuenta')),
        status.setup && isReg ? h('p', { class: 'notice' }, 'Primera configuración: esta cuenta será la del profesor administrador. Luego tus alumnos crean sus propias cuentas.') : null,
        form);
      (isReg ? name : email).focus();
    }

    root.replaceChildren(h('div', { class: 'auth' },
      h('section', { class: 'auth-intro' },
        h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, 'QA'), h('span', null, 'QA Academy')),
        h('h1', null, 'Aprende a ser tester con práctica real.'),
        h('p', null, 'Juegos, filminas y exámenes basados en el temario ISTQB Certified Tester Foundation Level v4.0.'),
        h('div', { class: 'tc-sample', 'aria-hidden': 'true' },
          h('div', { class: 'tc-row head' }, h('span', null, 'TC-014'), h('span', null, 'Registro · edad mínima')),
          h('div', { class: 'tc-row' }, h('span', null, 'Entrada'), h('span', null, 'edad = 18')),
          h('div', { class: 'tc-row' }, h('span', null, 'Esperado'), h('span', null, 'Registro aceptado')),
          h('div', { class: 'tc-row' }, h('span', null, 'Obtenido'), h('span', null, '"Debes ser mayor de edad"')),
          h('div', { class: 'tc-row foot' }, h('span', null, 'Técnica'), h('span', null, 'Valores límite'), h('span', { class: 'chip-s bad' }, 'Falla'))),
        h('ul', { class: 'auth-points' },
          h('li', null, '18 juegos por capítulo del temario'),
          h('li', null, 'Filminas para estudiar o dar clase'),
          h('li', null, 'Exámenes con nota, creados por tu profesor'))),
      h('section', { class: 'auth-card' }, formBox)));
    render();
  }

  /* ---------- Shell ---------- */
  function navItem(href, label, ic) {
    return h('a', { class: 'nav-item', href, 'data-href': href }, icon(ic), h('span', null, label));
  }

  function buildShell() {
    const teacher = user.role === 'profesor';
    const themeBtn = h('button', { class: 'nav-item', onclick: () => {
      theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
      try { localStorage.setItem('qa-theme', theme); } catch (e) { /* sin almacenamiento */ }
      applyTheme();
      themeBtn.replaceChildren(icon(theme === 'dark' ? 'moon' : 'sun'), h('span', null, THEME_LABEL[theme]));
    } }, icon(theme === 'dark' ? 'moon' : 'sun'), h('span', null, THEME_LABEL[theme]));

    const sidebar = h('aside', { class: 'sidebar', id: 'sidebar' },
      h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark' }, 'QA'), h('span', null, 'QA Academy')),
      h('div', { class: 'player', id: 'player' }),
      h('nav', { class: 'nav', 'aria-label': 'Principal' },
        h('span', { class: 'nav-group' }, 'Aprender'),
        navItem('#/', 'Inicio', 'home'),
        navItem('#/juegos', 'Juegos', 'grid'),
        navItem('#/filminas', 'Filminas', 'slides'),
        navItem('#/biblioteca', 'Biblioteca', 'book'),
        navItem('#/glosario', 'Glosario', 'glossary'),
        h('span', { class: 'nav-group' }, 'Evaluación'),
        teacher ? null : navItem('#/examenes', 'Mis exámenes', 'clipboard'),
        navItem('#/progreso', 'Progreso', 'chart'),
        teacher ? h('span', { class: 'nav-group' }, 'Profesor') : null,
        teacher ? navItem('#/profesor/examenes', 'Exámenes', 'clipboard') : null,
        teacher ? navItem('#/profesor/alumnos', 'Alumnos', 'users') : null),
      h('div', { class: 'nav sidebar-foot' },
        navItem('#/cuenta', user.name, 'user'),
        themeBtn,
        h('button', { class: 'nav-item', onclick: logout }, icon('logout'), h('span', null, 'Salir'))));

    const app = h('main', { id: 'app', class: 'content', tabindex: '-1' });
    root.replaceChildren(h('div', { class: 'shell' },
      h('header', { class: 'mobile-bar' },
        h('button', { class: 'icon-btn', 'aria-label': 'Abrir menú', 'aria-controls': 'sidebar', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
        h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark' }, 'QA'), h('span', null, 'QA Academy'))),
      sidebar,
      h('div', { class: 'scrim', onclick: () => document.body.classList.remove('nav-open') }),
      app));
    QA.renderPlayer();
    return app;
  }

  async function logout() {
    try { await API.post('/api/auth/logout'); } catch (e) { /* igual se cierra localmente */ }
    user = null;
    location.hash = '#/';
    boot();
  }

  /* ---------- Rutas ---------- */
  const routes = [
    [/^\/$/, app => LearnViews.home(app, user)],
    [/^\/juegos$/, app => LearnViews.games(app)],
    [/^\/juego\/([\w-]+)$/, (app, id) => LearnViews.gameScreen(app, id)],
    [/^\/filminas$/, app => LearnViews.slidesIndex(app)],
    [/^\/filminas\/([\w-]+)$/, (app, id) => LearnViews.slideViewer(app, id)],
    [/^\/biblioteca$/, app => LearnViews.library(app, user)],
    [/^\/glosario$/, app => LearnViews.glossary(app)],
    [/^\/progreso$/, app => LearnViews.progress(app)],
    [/^\/cuenta$/, app => LearnViews.account(app, user)],
    [/^\/examenes$/, app => ExamViews.list(app), 'alumno'],
    [/^\/examenes\/([\w-]+)$/, (app, id) => ExamViews.intro(app, id), 'alumno'],
    [/^\/resultado\/([\w-]+)$/, (app, id) => ExamViews.result(app, id, false)],
    [/^\/profesor\/examenes$/, app => TeacherViews.exams(app), 'profesor'],
    [/^\/profesor\/examenes\/nuevo$/, app => TeacherViews.editor(app, null), 'profesor'],
    [/^\/profesor\/examenes\/([\w-]+)\/resultados$/, (app, id) => TeacherViews.results(app, id), 'profesor'],
    [/^\/profesor\/examenes\/([\w-]+)$/, (app, id) => TeacherViews.editor(app, id), 'profesor'],
    [/^\/profesor\/alumnos$/, app => TeacherViews.students(app, user), 'profesor'],
    [/^\/profesor\/alumnos\/([\w-]+)$/, (app, id) => TeacherViews.studentDetail(app, id), 'profesor'],
    [/^\/profesor\/intento\/([\w-]+)$/, (app, id) => ExamViews.result(app, id, true), 'profesor'],
  ];

  function route() {
    if (!user) return;
    const app = document.getElementById('app');
    const path = (location.hash || '#/').slice(1) || '/';
    document.body.classList.remove('nav-open');
    document.querySelectorAll('.nav-item[data-href]').forEach(a => {
      const href = a.dataset.href.slice(1);
      a.classList.toggle('active', href === '/' ? path === '/' : path === href || path.startsWith(href + '/') || (href === '/juegos' && path.startsWith('/juego/')));
    });
    for (const [re, fn, role] of routes) {
      const m = path.match(re);
      if (!m) continue;
      if (role && user.role !== role) break;
      fn(app, m[1]);
      window.scrollTo(0, 0);
      return;
    }
    app.replaceChildren(UI.empty('Página no encontrada', 'El enlace no existe o no tienes acceso.', btn('Ir al inicio', { href: '#/' })));
  }

  function start(u, progress) {
    user = u;
    QA.loadState(progress);
    buildShell();
    route();
  }

  async function boot() {
    try {
      const r = await API.get('/api/me');
      start(r.user, r.progress);
    } catch (e) {
      if (e.status !== 401) {
        root.replaceChildren(UI.empty('No se pudo conectar con el servidor', 'Comprueba que el servidor esté en marcha (npm start) y recarga la página.'));
        return;
      }
      const status = await API.get('/api/status').catch(() => ({ setup: false }));
      authScreen(status);
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('qa:unauthorized', () => { if (user) { user = null; QA.toast('Tu sesión expiró. Vuelve a ingresar.'); boot(); } });
  boot();
})();
