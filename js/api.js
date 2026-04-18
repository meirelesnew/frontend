// ═══════════════════════════════════════════════════════════════
// API.JS — Comunicação com o backend do Tabuada Turbo
// Suporta: ranking global, salvar jogador, salvar resultado (auth)
// ═══════════════════════════════════════════════════════════════

const API = {
  // ── Helper ─────────────────────────────────────────────────
  _headers(comAuth = false) {
    const h = { "Content-Type": "application/json" };
    if (comAuth && typeof AUTH !== "undefined" && AUTH.estaLogado()) {
      h["Authorization"] = `Bearer ${AUTH.getToken()}`;
    }
    return h;
  },

  // ── Ranking (público) ──────────────────────────────────────
  getRanking: async (nivel = 0, modo = "todos", limite = 50) => {
    try {
      const res = await fetch(
        `${CONFIG.API_URL}/ranking/global?nivel=${nivel}&modo=${modo}&limite=${limite}`
      );
      if (!res.ok) throw new Error(`Erro ao carregar ranking: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("API Error (getRanking):", error);
      throw error;
    }
  },

  // ── Salvar jogador (anônimo, legado) ───────────────────────
  salvarJogador: async (dados) => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/jogador`, {
        method: "POST",
        headers: API._headers(),
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error(`Erro ao salvar jogador: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("API Error (salvarJogador):", error);
      throw error;
    }
  },

  // ── Salvar resultado (usa auth se disponível) ──────────────
  salvarRanking: async (dados) => {
    try {
      const comAuth = typeof AUTH !== "undefined" && AUTH.estaLogado();
      const res = await fetch(`${CONFIG.API_URL}/ranking/salvar`, {
        method: "POST",
        headers: API._headers(comAuth),
        body: JSON.stringify(dados)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erro ao salvar ranking: ${res.statusText}`);
      }
      return res.json();
    } catch (error) {
      console.error("API Error (salvarRanking):", error);
      throw error;
    }
  },

  // ── Meu histórico (requer auth) ────────────────────────────
  getMeuHistorico: async () => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/ranking/meus-resultados`, {
        headers: API._headers(true)
      });
      if (!res.ok) throw new Error("Erro ao carregar histórico");
      return res.json();
    } catch (error) {
      console.error("API Error (getMeuHistorico):", error);
      throw error;
    }
  }
};
