// Lógica da tela e inicialização do jogo
async function initApp() {
  console.log("Tabuada Turbo: Iniciando aplicação...");
  
  // Tenta carregar o ID do jogador do localStorage
  let jogadorId = localStorage.getItem('tt_jogador_id');
  
  if (jogadorId) {
    console.log("Jogador identificado:", jogadorId);
    // Aqui você pode chamar a API para validar o jogador se necessário
  } else {
    console.log("Novo jogador detectado.");
  }
}

// Exemplo de função para ser chamada pelo jogo
async function aoFinalizarJogo(nivel, tempo, acertos, erros, modo) {
  const jogadorId = localStorage.getItem('tt_jogador_id');
  const nome = localStorage.getItem('tt_nome') || "Anônimo";
  const avatar = localStorage.getItem('tt_avatar') || "🦁";

  const dadosRanking = {
    jogador_id: jogadorId,
    nome: nome,
    avatar: avatar,
    nivel: nivel,
    tempo: tempo,
    acertos: acertos,
    erros: erros,
    modo: modo
  };

  try {
    await API.salvarRanking(dadosRanking);
    console.log("Ranking salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar ranking global:", error);
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);
