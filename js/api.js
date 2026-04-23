// ══════════════════════════════════════════
//  API.JS v2 — fetch com timeout + retry
// ══════════════════════════════════════════

const API = {
  // BUG FIX: timeout configurável + AbortController correto
  async _fetch(url, opts = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(tid);
      return res;
    } catch (e) {
      clearTimeout(tid);
      throw e;
    }
  },

  _headers(auth = false) {
    const h = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('tt_token');
      if (token) h['Authorization'] = 'Bearer ' + token;
    }
    return h;
  },

  // Ranking global — público
  getRanking: async (nivel = 0, modo = 'todos', limite = 50) => {
    const url = `${CONFIG.API_URL}/ranking/global?nivel=${nivel}&modo=${modo}&limite=${limite}`;
    const res = await API._fetch(url, {}, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // Salvar resultado
  salvarRanking: async (dados) => {
    const res = await API._fetch(`${CONFIG.API_URL}/ranking/salvar`, {
      method:  'POST',
      headers: API._headers(),
      body:    JSON.stringify(dados)
    }, 8000);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // Salvar/buscar jogador
  salvarJogador: async (dados) => {
    const res = await API._fetch(`${CONFIG.API_URL}/jogador`, {
      method:  'POST',
      headers: API._headers(),
      body:    JSON.stringify(dados)
    }, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  getJogador: async (id) => {
    const res = await API._fetch(`${CONFIG.API_URL}/jogador/${id}`, {}, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // Health check
  ping: async () => {
    try {
      const res = await API._fetch(`${CONFIG.API_URL}/health`, {}, 5000);
      return res.ok;
    } catch { return false; }
  }
};

window.API = API;
