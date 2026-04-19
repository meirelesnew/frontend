// ══════════════════════════════════════════
//  COUNTDOWN
// ══════════════════════════════════════════
function mostrarCountdown(numero, jogadoresSala, callback) {
  mostrarTela('screen-countdown');

  // Renderizar jogadores
  const jEl = document.getElementById('countdown-jogadores');
  jEl.innerHTML = (jogadoresSala || []).map(j =>
    '<div class="countdown-jogador">' +
      '<div class="countdown-av">' + (j.avatar || '🦁') + '</div>' +
      '<div class="countdown-nome">' + j.nome + '</div>' +
    '</div>'
  ).join('<div style="font-family:Boogaloo,cursive;font-size:2rem;color:var(--accent);align-self:center">VS</div>');

  const numEl = document.getElementById('countdown-numero');
  const lblEl = document.getElementById('countdown-label');

  function tick(n) {
    // Reiniciar animação
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = 'countPop .8s ease-out forwards';

    if (n > 0) {
      numEl.textContent = n;
      lblEl.textContent = n === 3 ? '⚔️ Prepara!' : n === 2 ? '🎯 Atenção!' : '🚀 Já!';
      setTimeout(() => tick(n - 1), 900);
    } else {
      numEl.textContent = 'GO!';
      lblEl.textContent = '🔥 Bora!';
      setTimeout(() => {
        if (typeof callback === 'function') callback();
      }, 700);
    }
  }
  tick(numero);
}

// ══════════════════════════════════════════
//  WHATSAPP
// ══════════════════════════════════════════
function compartilharWhatsApp() {
  const codigo = document.getElementById('codigo-sala-display').textContent;
  const url = 'https://meirelesnew.github.io/tabuada-turbo/';
  const msg = '⚡ Tabuada Turbo — Batalha!\n\nVem me desafiar na tabuada! 😤\n\n🔑 Código da sala: *' + codigo + '*\n\n👉 Acesse: ' + url + '\n\nQuem termina primeiro vence! ⚔️';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function compartilharResultadoWhatsApp() {
  const titulo = document.getElementById('batalha-resultado-titulo').textContent;
  const ganhei = titulo.includes('VENCEU');
  const url = 'https://meirelesnew.github.io/tabuada-turbo/';
  const tempoEl = document.querySelector('#batalha-placar .rank-time');
  const tempo = tempoEl ? tempoEl.textContent : '';
  const msg = ganhei ? '🏆 Venci na Tabuada Turbo! ⚡\n\nFiz em *' + tempo + '*!\n\nVem me desafiar: ' + url : '😤 Perdi desta vez...\n\nBora revanche: ' + url + ' ⚔️';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

// ══════════════════════════════════════════
//  FEEDBACK VISUAL (sem confirm/alert)
// ══════════════════════════════════════════
const STORAGE_KEYS = {
  recorde_nivel1: 'tt_recorde_nivel1',
  recorde_nivel2: 'tt_recorde_nivel2'
};

let feedbackTimer = null;
function mostrarFeedback(msg, tipo) {
  const el = document.getElementById('feedback-overlay');
  if (!el) return;
  clearTimeout(feedbackTimer);
  el.textContent = msg;
  el.className = 'show ' + (tipo || 'info');
  feedbackTimer = setTimeout(() => { el.className = ''; }, 2200);
}

function inputFeedback(tipo) {
  const el = document.getElementById('resposta-display');
  if (!el) return;
  el.classList.remove('input-pulse', 'input-shake');
  void el.offsetWidth;
  el.classList.add(tipo === 'success' ? 'input-pulse' : 'input-shake');
}

// ── RECORDES ──────────────────────────────
function carregarRecorde(nivel) {
  const key = nivel === 1 ? STORAGE_KEYS.recorde_nivel1 : STORAGE_KEYS.recorde_nivel2;
  const val = localStorage.getItem(key);
  return val ? parseInt(val) : null;
}

function salvarRecorde(nivel, tempo) {
  const key = nivel === 1 ? STORAGE_KEYS.recorde_nivel1 : STORAGE_KEYS.recorde_nivel2;
  const atual = carregarRecorde(nivel);
  if (atual === null || tempo < atual) {
    localStorage.setItem(key, tempo);
    return true; // novo recorde!
  }
  return false;
}

function exibirRecordeTela(nivel) {
  const recorde = carregarRecorde(nivel);
  const el = document.getElementById('high-score-display');
  const val = document.getElementById('high-score-valor');
  if (!el || !val) return;
  if (recorde !== null) {
    el.style.display = 'flex';
    val.textContent = formatarTempo(recorde) + ' (Nv' + nivel + ')';
  } else {
    el.style.display = 'none';
  }
}

async function finalizarComRecorde(nivel, tempo) {
  const novoRecorde = salvarRecorde(nivel, tempo);
  if (novoRecorde) {
    mostrarFeedback('🏆 NOVO RECORDE! ' + formatarTempo(tempo), 'success');
  }
  exibirRecordeTela(nivel);
  await sincronizarProgressoNuvem(nivel, tempo);
}

async function sincronizarProgressoNuvem(nivel, tempo) {
  const jid = localStorage.getItem('tt_jogador_id');
  if (!jid) return;
  try {
    const payload = {
      jogador_id: jid,
      nome: jogador?.nome || localStorage.getItem('tt_nome') || 'Jogador',
      avatar: jogador?.avatar || localStorage.getItem('tt_avatar') || '🦁',
      nivel: nivel,
      recordes_tempo: tempo,
      ultimo_jogo: {
        nivel,
        tempo,
        data: new Date().toISOString()
      }
    };
    await API.salvarJogador(payload);
    console.log('[SYNC] Progresso salvo na nuvem');
  } catch (e) {
    console.warn('[SYNC] Erro ao sincronizar:', e.message);
  }
}
    };
    await API.salvarJogador(payload);
    console.log('[SYNC] Progresso salvo na nuvem');
  } catch (e) {
    console.warn('[SYNC] Erro ao sincronizar:', e.message);
  }
}

function limparDados() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('tt_ranking_1');
  localStorage.removeItem('tt_ranking_2');
  localStorage.removeItem('tt_jogador');
  mostrarFeedback('Dados limpos!', 'info');
}

// ══════════════════════════════════════════
//  SISTEMA DE MÚSICA (Web Audio API)
// ══════════════════════════════════════════
let audioCtx = null;
let musicaNodes = [];
let musicaAtiva = false;
let musicaLoop = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Notas em Hz — escala pentatônica (alegre, dopaminérgica)
const NOTAS = {
  C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00,
  C5:523.25, D5:587.33, E5:659.25, G5:783.99, A5:880.00,
  B4:493.88, F4:349.23
};

// Melodia principal — loop energético 8-bit style
const MELODIA_JOGO = [
  {n:'C5',d:0.12},{n:'E5',d:0.12},{n:'G5',d:0.12},{n:'E5',d:0.12},
  {n:'C5',d:0.12},{n:'D5',d:0.12},{n:'E5',d:0.25},{n:'_',d:0.1},
  {n:'G4',d:0.12},{n:'A4',d:0.12},{n:'C5',d:0.12},{n:'A4',d:0.12},
  {n:'G4',d:0.12},{n:'E4',d:0.12},{n:'G4',d:0.25},{n:'_',d:0.1},
  {n:'E4',d:0.12},{n:'G4',d:0.12},{n:'A4',d:0.12},{n:'C5',d:0.12},
  {n:'D5',d:0.12},{n:'E5',d:0.12},{n:'G5',d:0.25},{n:'_',d:0.1},
  {n:'A5',d:0.12},{n:'G5',d:0.12},{n:'E5',d:0.12},{n:'D5',d:0.12},
  {n:'C5',d:0.12},{n:'B4',d:0.12},{n:'C5',d:0.35},{n:'_',d:0.15},
];

// Fanfarra de vitória
const MELODIA_VITORIA = [
  {n:'C5',d:0.1},{n:'C5',d:0.1},{n:'C5',d:0.1},{n:'C5',d:0.25},
  {n:'G4',d:0.25},{n:'A4',d:0.12},{n:'G4',d:0.12},
  {n:'C5',d:0.15},{n:'E5',d:0.15},{n:'G5',d:0.35},
  {n:'_',d:0.1},
  {n:'G5',d:0.12},{n:'F4',d:0.12},{n:'E5',d:0.12},{n:'D5',d:0.12},
  {n:'C5',d:0.5},
];

function tocarNota(freq, tempo, duracao, volume, tipo) {
  if (!audioCtx) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const vol  = volume || 0.15;
  const t    = audioCtx.currentTime + tempo;

  osc.type = tipo || 'square';
  osc.frequency.setValueAtTime(freq, t);
  // Envelope suave
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duracao * 0.9);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duracao);
  musicaNodes.push(osc);
}

function tocarBaixo(freq, tempo, duracao) {
  tocarNota(freq * 0.5, tempo, duracao, 0.08, 'triangle');
}

function tocarMelodia(melodia, offset, volume) {
  let t = offset || 0;
  melodia.forEach(note => {
    if (note.n !== '_' && NOTAS[note.n]) {
      tocarNota(NOTAS[note.n], t, note.d * 0.85, volume || 0.15, 'square');
      if (t % 0.5 < 0.1) {
        tocarBaixo(NOTAS[note.n], t, note.d * 1.2);
      }
    }
    t += note.d;
  });
  return t;
}

function calcularDuracaoMelodia(melodia) {
  return melodia.reduce((s, n) => s + n.d, 0);
}

function iniciarMusicaJogo() {
  if (musicaAtiva) return;
  try {
    getAudioCtx();
    musicaAtiva = true;
    const dur = calcularDuracaoMelodia(MELODIA_JOGO);

    function loop() {
      if (!musicaAtiva) return;
      tocarMelodia(MELODIA_JOGO, 0, 0.15);
      musicaLoop = setTimeout(loop, dur * 1000);
    }
    loop();
  } catch(e) {}
}

function tocarVitoria() {
  try {
    getAudioCtx();
    tocarMelodia(MELODIA_VITORIA, 0, 0.25);
  } catch(e) {}
}

function tocarAcerto() {
  try {
    getAudioCtx();
    tocarNota(NOTAS.E5, 0, 0.08, 0.12, 'sine');
    tocarNota(NOTAS.G5, 0.06, 0.08, 0.1, 'sine');
  } catch(e) {}
}

function tocarErro() {
  try {
    getAudioCtx();
    tocarNota(180, 0, 0.12, 0.1, 'sawtooth');
    tocarNota(150, 0.1, 0.12, 0.08, 'sawtooth');
  } catch(e) {}
}

function pararMusica() {
  musicaAtiva = false;
  clearTimeout(musicaLoop);
  musicaNodes.forEach(n => { try { n.stop(); } catch(e) {} });
  musicaNodes = [];
}

// Botão mute no jogo
let musicaMutada = false;
function toggleMusica() {
  musicaMutada = !musicaMutada;
  const btn = document.getElementById('btn-musica');
  if (btn) btn.textContent = musicaMutada ? '🔇' : '🎵';
  if (musicaMutada) {
    pararMusica();
  } else {
    iniciarMusicaJogo();
  }
}

// ══════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════
let toastTimer = null;
function toast(msg, tipo) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2000);
}