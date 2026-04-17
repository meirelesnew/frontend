const API = {
  getRanking: async (nivel = 0, modo = "todos", limite = 50) => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/ranking/global?nivel=${nivel}&modo=${modo}&limite=${limite}`);
      if (!res.ok) throw new Error(`Erro ao carregar ranking: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("API Error (getRanking):", error);
      throw error;
    }
  },

  salvarJogador: async (dados) => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/jogador`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error(`Erro ao salvar jogador: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("API Error (salvarJogador):", error);
      throw error;
    }
  },

  salvarRanking: async (dados) => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/ranking/salvar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error(`Erro ao salvar ranking: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("API Error (salvarRanking):", error);
      throw error;
    }
  }
};
