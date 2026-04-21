// ═══════════════════════════════════════════════════════════════
// SOCKET.JS — Cliente Socket.io para batalhas em tempo real
// ═══════════════════════════════════════════════════════════════

const BATALHA = {
  socket: null,
  conectado: false,
  salaAtual: null,
  callbacks: {},

  init() {
    if (this.socket) return;
    // Socket.io deve conectar na raiz do servidor, não em /api
    const socketURL = CONFIG.API_URL.replace(/\/api$/, "");
    this.socket = io(socketURL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    this.socket.on("connect", () => {
      this.conectado = true;
      console.log("[SOCKET] Conectado ao servidor");
      if (typeof toast === "function") toast("🟢 Conectado para batalha!", "ok");
    });

    this.socket.on("disconnect", () => {
      this.conectado = false;
      console.log("[SOCKET] Desconectado");
      if (typeof toast === "function") toast("🔴 Conexão perdida", "err");
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SOCKET] Erro de conexão:", err.message);
    });

    // Eventos da sala
    this.socket.on("sala_criada", (data) => {
      this.salaAtual = data.codigo;
      console.log("[SOCKET] Sala criada:", data.codigo);
      if (this.callbacks.onSalaCriada) this.callbacks.onSalaCriada(data);
    });

    this.socket.on("sala_encontrada", (data) => {
      this.salaAtual = data.codigo;
      console.log("[SOCKET] Sala encontrada:", data.codigo);
      if (this.callbacks.onSalaEncontrada) this.callbacks.onSalaEncontrada(data);
    });

    this.socket.on("erro", (data) => {
      console.error("[SOCKET] Erro:", data.message);
      if (typeof toast === "function") toast(data.message, "err");
    });

    // Eventos da batalha
    this.socket.on("jogador_entrou", (data) => {
      console.log("[SOCKET] Jogador entrou:", data.nome);
      if (this.callbacks.onJogadorEntrou) this.callbacks.onJogadorEntrou(data);
    });

    this.socket.on("batalha_iniciada", (data) => {
      console.log("[SOCKET] Batalha iniciada!");
      if (this.callbacks.onBatalhaIniciada) this.callbacks.onBatalhaIniciada(data);
    });

    this.socket.on("progresso_atualizado", (data) => {
      if (this.callbacks.onProgressoAtualizado) this.callbacks.onProgressoAtualizado(data);
    });

    this.socket.on("jogador_finalizou", (data) => {
      console.log("[SOCKET] Jogador finalizou:", data.nome);
      if (this.callbacks.onJogadorFinalizou) this.callbacks.onJogadorFinalizou(data);
    });

    this.socket.on("batalha_finalizada", (data) => {
      console.log("[SOCKET] Batalha finalizada!");
      if (this.callbacks.onBatalhaFinalizada) this.callbacks.onBatalhaFinalizada(data);
    });

    this.socket.on("jogador_saiu", (data) => {
      console.log("[SOCKET] Jogador saiu:", data.nome);
      if (this.callbacks.onJogadorSaiu) this.callbacks.onJogadorSaiu(data);
    });

    this.socket.on("adversario_desconectou", () => {
      console.log("[SOCKET] Adversário desconectou!");
      if (typeof toast === "function") toast("Adversário desconectou!", "err");
      if (this.callbacks.onAdversarioDesconectou) this.callbacks.onAdversarioDesconectou();
    });
  },

  criarSala(jogador_id, nome, avatar, nivel) {
    if (!this.socket) this.init();
    this.socket.emit("criar_sala", { jogador_id, nome, avatar, nivel });
  },

  entrarSala(codigo, jogador_id, nome, avatar) {
    if (!this.socket) this.init();
    this.socket.emit("entrar_sala", { codigo, jogador_id, nome, avatar });
  },

  iniciarBatalha() {
    if (!this.socket) return;
    this.socket.emit("iniciar_batalha");
  },

  atualizarProgresso(tempo, acertos, erros) {
    if (!this.socket) return;
    this.socket.emit("atualizar_progresso", { tempo, acertos, erros });
  },

  finalizarBatalha(tempo, acertos, erros) {
    if (!this.socket) return;
    this.socket.emit("finalizar_batalha", { tempo, acertos, erros });
  },

  sairSala() {
    if (!this.socket) return;
    this.socket.emit("sair_sala");
    this.salaAtual = null;
  },

  on(event, callback) {
    this.callbacks[event] = callback;
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.conectado = false;
    }
  }
};

window.BATALHA = BATALHA;