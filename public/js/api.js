/* Cliente de la API del servidor. Lanza Error con el mensaje del servidor si algo falla. */
const API = (() => {
  async function request(method, path, body) {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* respuesta sin cuerpo */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Error ${res.status}`);
      err.status = res.status;
      if (res.status === 401 && path !== '/api/me' && !path.startsWith('/api/auth/')) {
        window.dispatchEvent(new CustomEvent('qa:unauthorized'));
      }
      throw err;
    }
    return data;
  }
  return {
    get: p => request('GET', p),
    post: (p, b = {}) => request('POST', p, b),
    put: (p, b = {}) => request('PUT', p, b),
    del: p => request('DELETE', p),
  };
})();
