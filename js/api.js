// ══════════════════════════════════════════════════════
//  API.JS — fetch com timeout, nunca trava a UI
// ══════════════════════════════════════════════════════

const API = {
  _fetch(url, opts = {}, ms = 7000) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...opts, signal: ctrl.signal })
      .then(r  => { clearTimeout(tid); return r; })
      .catch(e => { clearTimeout(tid); throw e; });
  },

  _h(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const tok = localStorage.getItem('tt_token');
    if (tok) h['Authorization'] = 'Bearer ' + tok;
    return h;
  },

  getRanking(nivel = 0, modo = 'todos', limite = 50) {
    return API._fetch(
      `${CONFIG.API_URL}/ranking/global?nivel=${nivel}&modo=${modo}&limite=${limite}`,
      {}, 7000
    ).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },

  salvarRanking(dados) {
    return API._fetch(`${CONFIG.API_URL}/ranking/salvar`, {
      method: 'POST', headers: API._h(), body: JSON.stringify(dados)
    }, 7000).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },

  salvarJogador(dados) {
    return API._fetch(`${CONFIG.API_URL}/jogador`, {
      method: 'POST', headers: API._h(), body: JSON.stringify(dados)
    }, 7000).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },

  ping() {
    return API._fetch(`${CONFIG.API_URL}/health`, {}, 4000)
      .then(r => r.ok).catch(() => false);
  }
};

window.API = API;
