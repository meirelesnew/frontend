// ══════════════════════════════════════════
//  ESTADO GLOBAL
// ══════════════════════════════════════════
const AVATARES = ['🦁','🐯','🐸','🦊','🐧','🦄','🐉','🤖','👾','🦸'];
// API_URL centralizada em js/config.js
let jogador = { nome: '', avatar: '🦁' };
// jogadorId persistente — SEMPRE recuperar do localStorage para evitar duplicatas
let jogadorId = localStorage.getItem('tt_jogador_id') || null;
console.log('[INIT] jogadorId recuperado:', getOuCriarJogadorId());
let respostaAtual = '';
let salaAtual = null;
let pollingInterval = null;
let modoAtual = 'solo'; // 'solo' | 'batalha'
let nivel = 1;
let timerInterval = null;
let segundos = 0;
let celulas = [];        // [{x, y, correto: bool|null}]
let celulaAtiva = null;  // índice em celulas
let axisX = [];
let axisY = [];
let acertos = 0;
let erros = 0;
let jogoAtivo = false;
let nivelAtualJogo = 1;

function getOuCriarJogadorId() {
  if (!jogadorId) {
    jogadorId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('tt_jogador_id', jogadorId);
  }
  return jogadorId;
}

// ── Entrada sem conta (modo visitante) ────────────────────────────────────
async function entrarSemConta() {
  const nomeSalvo   = localStorage.getItem('tt_nome')   || '';
  const avatarSalvo = localStorage.getItem('tt_avatar') || '🦁';
  if (nomeSalvo) {
    jogador.nome   = nomeSalvo;
    jogador.avatar = avatarSalvo;
    getOuCriarJogadorId();
    await sincronizarProgresso();
    mostrarTela('screen-menu');
    renderPlayerBar('menu');
    exibirRecordeTela(1);
  } else {
    mostrarTela('screen-cadastro');
  }
}

async function sincronizarProgresso() {
  const jid = getOuCriarJogadorId();
  try {
    const res = await fetch(`${CONFIG.API_URL}/jogador/${jid}`);
    if (res.ok) {
      const dados = await res.json();
      if (dados.nome && dados.nome !== 'Jogador') {
        jogador.nome = dados.nome;
        jogador.avatar = dados.avatar || '🦁';
        localStorage.setItem('tt_nome', dados.nome);
        localStorage.setItem('tt_avatar', dados.avatar);
        localStorage.setItem('tt_jogador', JSON.stringify(jogador));
        if (dados.recordes) {
          localStorage.setItem('tt_recorde_1', dados.recordes[1] || '');
          localStorage.setItem('tt_recorde_2', dados.recordes[2] || '');
        }
      }
    }
  } catch (e) {
    console.warn('[SYNC] Sem conexão para carregar progresso:', e.message);
  }
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderAvatares();
  carregarJogador();
  // Teclado físico também funciona (para quem usa no PC)
  document.addEventListener('keydown', e => {
    if (!jogoAtivo) return;
    if (e.key >= '0' && e.key <= '9') numpadPress(e.key);
    else if (e.key === 'Backspace') numpadPress('del');
    else if (e.key === 'Enter') numpadPress('ok');
  });
});

function renderAvatares() {
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = '';
  AVATARES.forEach((av, i) => {
    const btn = document.createElement('button');
    btn.className = 'av-btn' + (i === 0 ? ' selected' : '');
    btn.textContent = av;
    btn.setAttribute('aria-label', 'Avatar ' + av);
    btn.setAttribute('role', 'radio');
    btn.onclick = () => {
      document.querySelectorAll('.av-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      jogador.avatar = av;
    };
    grid.appendChild(btn);
  });
}

function carregarJogador() {
  const salvo = localStorage.getItem('tt_jogador');
  if (salvo) {
    jogador = JSON.parse(salvo);
    document.getElementById('inp-nome').value = jogador.nome;
    document.querySelectorAll('.av-btn').forEach(b => {
      if (b.textContent === jogador.avatar) {
        document.querySelectorAll('.av-btn').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
      }
    });
  }
}

// ══════════════════════════════════════════
//  NAVEGAÇÃO
// ══════════════════════════════════════════
function mostrarTela(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

async function irParaMenu() {
  // Se logado via AUTH, preencher jogador e pular validarCadastro
  if (typeof AUTH !== 'undefined' && AUTH.estaLogado()) {
    const u = AUTH.getUser();
    if (u) {
      jogador.nome   = u.nome;
      jogador.avatar = u.avatar || jogador.avatar || '🦁';
      localStorage.setItem('tt_jogador', JSON.stringify(jogador));
    }
  } else {
    // Não logado via AUTH - precisa validar cadastro
    if (!validarCadastro()) return;
  }
  const rec1 = localStorage.getItem('tt_recorde_1');
  const rec2 = localStorage.getItem('tt_recorde_2');
  try {
    const payload = { 
      jogador_id: getOuCriarJogadorId(), 
      nome: jogador.nome, 
      avatar: jogador.avatar,
      recordes: {}
    };
    if (rec1) payload.recordes[1] = parseInt(rec1);
    if (rec2) payload.recordes[2] = parseInt(rec2);
    const d = await API.salvarJogador(payload);
    if (d.jogador_id) {
      jogadorId = d.jogador_id;
      localStorage.setItem('tt_jogador_id', jogadorId);
    }
    console.log('[JOGADOR] Sincronizado:', d);
  } catch(e) {
    console.warn('[API] offline — usando ID local:', e.message);
    if (!jogadorId) jogadorId = 'local_' + Date.now();
  }
  renderPlayerBar('menu');
  exibirRecordeTela(1);
  mostrarTela('screen-menu');
}

function trocarJogador() {
  mostrarTela('screen-cadastro');
}

function sairDaConta() {
  if (typeof AUTH !== 'undefined') {
    const user = AUTH.getUser();
    const nome = user ? user.nome : 'sua conta';
    if (AUTH.estaLogado()) {
      if (!confirm(`Deseja sair de ${nome}?`)) return;
      AUTH.logout();
    } else {
      mostrarTela('screen-entrada');
    }
  } else {
    mostrarTela('screen-entrada');
  }
}

function irParaRanking() {
  switchTab(1);
  mostrarTela('screen-ranking');
}

function jogarNovamente() {
  iniciarJogo(nivelAtualJogo);
}

// ══════════════════════════════════════════
//  CADASTRO
// ══════════════════════════════════════════
function validarCadastro() {
  const nome = document.getElementById('inp-nome').value.trim();
  if (!nome) { toast('Digite seu apelido! 😅', 'err'); return false; }
  jogador.nome = nome;
  const sel = document.querySelector('.av-btn.selected');
  if (sel) jogador.avatar = sel.textContent;
  localStorage.setItem('tt_jogador', JSON.stringify(jogador));
  return true;
}

// ══════════════════════════════════════════
//  PLAYER BAR
// ══════════════════════════════════════════
function renderPlayerBar(ctx) {
  const el = document.getElementById('player-bar-' + ctx);
  if (!el) return;
  el.innerHTML = `
    <div class="player-avatar">${jogador.avatar}</div>
    <div>
      <div class="player-name">${jogador.nome}</div>
      <div class="player-level">${ctx === 'jogo' ? (nivelAtualJogo === 1 ? '📊 Nível 1 — Clássico' : '🎲 Nível 2 — Embaralhado') : ''}</div>
    </div>
  `;
}

// ══════════════════════════════════════════
//  JOGO — SETUP
// ══════════════════════════════════════════
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function iniciarJogo(lv) {
  nivelAtualJogo = lv;
  nivel = lv;
  acertos = 0;
  erros = 0;
  segundos = 0;
  jogoAtivo = true;
  celulaAtiva = null;
  respostaAtual = '';
  if (modoAtual !== 'batalha') modoAtual = 'solo';

  // Eixos
  const base = [1,2,3,4,5,6,7,8,9,10];
  axisX = lv === 1 ? [...base] : shuffle([...base]);
  axisY = lv === 1 ? [...base] : shuffle([...base]);

  // Células (todas sem resposta)
  celulas = [];
  for (let yi = 0; yi < 10; yi++) {
    for (let xi = 0; xi < 10; xi++) {
      celulas.push({ x: axisX[xi], y: axisY[yi], correto: null, xi, yi });
    }
  }

  renderPlayerBar('jogo');
  renderTabela();
  atualizarStats();
  proximaPergunta();
  iniciarTimer();
  mostrarTela('screen-jogo');
  // sem foco em input nativo
}

// ══════════════════════════════════════════
//  TABELA VISUAL
// ══════════════════════════════════════════
function renderTabela() {
  const table = document.getElementById('mult-table');
  table.innerHTML = '';

  // Cabeçalho
  const thead = document.createElement('thead');
  const hrw = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  corner.textContent = '✖';
  hrw.appendChild(corner);
  axisX.forEach(x => {
    const th = document.createElement('th');
    th.textContent = x;
    hrw.appendChild(th);
  });
  thead.appendChild(hrw);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  axisY.forEach((y, yi) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = y;
    tr.appendChild(th);
    axisX.forEach((x, xi) => {
      const td = document.createElement('td');
      td.id = `cell-${xi}-${yi}`;
      td.dataset.xi = xi;
      td.dataset.yi = yi;
      td.onclick = () => selecionarCelula(xi, yi);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function atualizarCelulaVisual(idx) {
  const c = celulas[idx];
  const td = document.getElementById(`cell-${c.xi}-${c.yi}`);
  if (!td) return;
  td.className = '';
  td.textContent = '';
  if (c.correto === true) {
    td.classList.add('answered-correct');
    td.textContent = c.x * c.y;
  } else if (c.correto === false) {
    td.classList.add('answered-wrong');
    td.textContent = c.x * c.y;
  } else if (idx === celulaAtiva) {
    td.classList.add('active-cell');
  }
}

function atualizarHighlight(xi, yi) {
  // Limpar todos highlights
  document.querySelectorAll('.mult-table th').forEach(th => {
    th.classList.remove('col-ativa', 'row-ativa');
  });
  document.querySelectorAll('.mult-table td').forEach(td => {
    td.classList.remove('col-highlight', 'row-highlight', 'cross-highlight');
  });
  if (xi === undefined || yi === undefined) return;

  // Header da coluna (linha 0, posição xi+1)
  const thead = document.querySelector('.mult-table thead tr');
  if (thead) {
    const ths = thead.querySelectorAll('th');
    if (ths[xi + 1]) ths[xi + 1].classList.add('col-ativa');
  }
  // Header da linha (tbody, linha yi, primeiro th)
  const tbody = document.querySelector('.mult-table tbody');
  if (tbody) {
    const rows = tbody.querySelectorAll('tr');
    if (rows[yi]) {
      const rowTh = rows[yi].querySelector('th');
      if (rowTh) rowTh.classList.add('row-ativa');
    }
  }
  // Highlight células col e row
  celulas.forEach((c, i) => {
    if (c.correto !== null) return; // já respondida, não recolore
    const td = document.getElementById('cell-' + c.xi + '-' + c.yi);
if (!td) return;
  const naCol = c.xi === xi;
  const naRow = c.yi === yi;
  if (naCol && naRow) return;
  if (naCol) td.classList.add('col-highlight');
  else if (naRow) td.classList.add('row-highlight');
});
}

// ══════════════════════════════════════════
//  PERGUNTA
// ══════════════════════════════════════════
function proximaPergunta() {
  const pendentes = celulas.map((c, i) => ({...c, i})).filter(c => c.correto === null);
  if (pendentes.length === 0) { finalizarJogo(); return; }
  const idx = pendentes[0].i;
  celulaAtiva = idx;
  const c = celulas[idx];

  document.getElementById('question-text').innerHTML = '<span>' + c.x + '</span> × <span>' + c.y + '</span> =';
  respostaAtual = '';
  const el = document.getElementById('resposta-display');
  if (el) { el.textContent = '?'; el.classList.remove('preenchido'); }

  celulas.forEach((_, i) => atualizarCelulaVisual(i));
  atualizarHighlight(c.xi, c.yi);
  atualizarStats();
}

function selecionarCelula(xi, yi) {
  const idx = celulas.findIndex(c => c.xi === xi && c.yi === yi && c.correto === null);
  if (idx === -1) return;
  celulaAtiva = idx;
  const c = celulas[idx];
  document.getElementById('question-text').innerHTML = '<span>' + c.x + '</span> × <span>' + c.y + '</span> =';
  respostaAtual = '';
  const el = document.getElementById('resposta-display');
  if (el) { el.textContent = '?'; el.classList.remove('preenchido'); }
  celulas.forEach((_, i) => atualizarCelulaVisual(i));
  atualizarHighlight(xi, yi);
}
  // sem foco em input nativo

function confirmarResposta() {
  if (!jogoAtivo || celulaAtiva === null) return;
  const val = parseInt(respostaAtual);
  if (isNaN(val) || respostaAtual === '') { toast('Digite um número!', 'err'); return; }
  const c = celulas[celulaAtiva];
  const correto = val === c.x * c.y;

  // Limpar display da resposta
  respostaAtual = '';
  const el = document.getElementById('resposta-display');
  if (el) { el.textContent = '?'; el.classList.remove('preenchido'); }

  if (correto) {
    // ✅ ACERTOU — marca e avança
    acertos++;
    celulas[celulaAtiva].correto = true;
    flashTela('correct');
    inputFeedback('success');
    tocarAcerto();
    toast('✅ ' + c.x + '×' + c.y + '=' + (c.x*c.y), 'ok');
    atualizarCelulaVisual(celulaAtiva);
    celulaAtiva = null;
    setTimeout(proximaPergunta, 400);
  } else {
    // ❌ ERROU — conta erro mas FICA na mesma célula
    erros++;
    flashTela('wrong');
    inputFeedback('error');
    tocarErro();
    toast('❌ Errado! Tente novamente: ' + c.x + ' × ' + c.y + ' = ?', 'err');
    atualizarStats();
    // Célula permanece ativa — NÃO avança, NÃO chama proximaPergunta
  }
}

function numpadPress(v) {
  if (!jogoAtivo) return;
  if (v === 'del') {
    respostaAtual = respostaAtual.slice(0, -1);
  } else if (v === 'ok') {
    confirmarResposta();
    return;
  } else {
    if (respostaAtual.length < 3) respostaAtual += v;
  }
  const el = document.getElementById('resposta-display');
  el.textContent = respostaAtual || '?';
  el.classList.toggle('preenchido', respostaAtual.length > 0);
}

// ══════════════════════════════════════════
//  STATS & TIMER
// ══════════════════════════════════════════
function atualizarStats() {
  const restam = celulas.filter(c => c.correto === null).length;
  document.getElementById('stat-acertos').textContent = acertos;
  document.getElementById('stat-erros').textContent = erros;
  document.getElementById('stat-restam').textContent = restam;
  const pct = ((100 - restam) / 100) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';

  if (modoAtual === 'batalha' && BATALHA.conectado) {
    BATALHA.atualizarProgresso(segundos, acertos, erros);
  }
}

function iniciarTimer() {
  clearInterval(timerInterval);
  segundos = 0;
  timerInterval = setInterval(() => {
    if (!jogoAtivo) return;
    segundos++;
    const m = String(Math.floor(segundos/60)).padStart(2,'0');
    const s = String(segundos%60).padStart(2,'0');
    const el = document.getElementById('timer-display');
    el.textContent = `${m}:${s}`;
    el.classList.toggle('danger', segundos > 120);
  }, 1000);
}

function formatarTempo(s) {
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${m}:${sec}`;
}

// ══════════════════════════════════════════
//  FINALIZAR
// ══════════════════════════════════════════
function finalizarJogo() {
  jogoAtivo = false;
  clearInterval(timerInterval);
  pararMusica();

  const entrada = {
    nome: jogador.nome,
    avatar: jogador.avatar,
    nivel: nivelAtualJogo,
    tempo: segundos,
    acertos,
    erros,
    data: new Date().toLocaleDateString('pt-BR')
  };

  // Modo batalha — envia resultado para a API e espera adversário
  if (modoAtual === 'batalha' && salaAtual) {
    enviarResultadoBatalha();
    return;
  }

  // Modo solo — salvarRanking já cuida do local + API
  salvarRanking(entrada);

  finalizarComRecorde(nivelAtualJogo, segundos);
  mostrarResultado(entrada);
  lancarConfetti();
}

function mostrarResultado(entrada) {
  const perfeito  = entrada.erros === 0;
  const muito_bom = entrada.acertos >= 80;
  const emoji     = perfeito ? '🏆' : muito_bom ? '🥈' : '🎯';
  const nivCeleb  = perfeito ? 'ouro' : muito_bom ? 'prata' : 'bronze';

  // Troféu
  const trofeuEl = document.getElementById('result-trophy');
  trofeuEl.textContent = emoji;
  setTimeout(() => animarTrofeu('result-trophy', perfeito), 100);

  // Banner
  const banner = document.getElementById('result-banner');
  if (banner) {
    if (perfeito) {
      banner.innerHTML = '<div class="banner-vencedor">🏆 PERFEITO! SEM ERROS! 🏆</div>';
    } else if (muito_bom) {
      banner.innerHTML = '<div class="banner-vencedor" style="background:linear-gradient(135deg,#c0c0c0,#808080);color:#fff">🥈 MUITO BOM! 🥈</div>';
    } else {
      banner.innerHTML = '';
    }
  }

  document.getElementById('result-time').textContent = formatarTempo(entrada.tempo);
  document.getElementById('result-acertos').innerHTML =
    '<strong>' + entrada.acertos + '</strong> acertos &nbsp;|&nbsp; <span style="color:var(--red)">' + entrada.erros + '</span> erros';

  // Badge novo recorde
  const badgeEl = document.getElementById('result-recorde-badge');
  if (badgeEl) {
    const recorde = carregarRecorde(entrada.nivel);
    const novoRecorde = recorde === null || entrada.tempo < recorde;
    badgeEl.innerHTML = novoRecorde
      ? '<span class="novo-recorde-badge">⚡ NOVO RECORDE!</span>'
      : '';
  }

  // Posição no ranking
  const rank = getRanking(entrada.nivel);
  const pos = rank.findIndex(r => r.nome === entrada.nome && r.tempo === entrada.tempo && r.data === entrada.data) + 1;
  const preview = document.getElementById('result-rank-preview');
  preview.innerHTML = '<div style="text-align:center">' +
    '<div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px">Sua posição no ranking</div>' +
    '<div style="font-family:Boogaloo,cursive; font-size:2.5rem; color:var(--accent2)">#' + pos + '</div>' +
    '<div style="font-size:0.8rem; color:var(--muted)">Nível ' + (entrada.nivel === 1 ? '1 — Clássico' : '2 — Embaralhado') + '</div>' +
  '</div>';

  mostrarTela('screen-resultado');
  setTimeout(() => {
    celebracaoCompleta(nivCeleb);
    if (perfeito || muito_bom) tocarVitoria();
  }, 300);
}

function confirmarDesistir() {
  jogoAtivo = false;
  clearInterval(timerInterval);
  mostrarFeedback('Jogo encerrado! Voltando ao menu...', 'info');
  setTimeout(() => irParaMenu(), 1500);
}

// ══════════════════════════════════════════
//  EFEITOS
// ══════════════════════════════════════════
function flashTela(tipo) {
  const qb = document.getElementById('question-box');
  qb.classList.remove('flash-correct','flash-wrong');
  void qb.offsetWidth;
  qb.classList.add(tipo === 'correct' ? 'flash-correct' : 'flash-wrong');
}

// ══════════════════════════════════════════
//  SISTEMA DE CELEBRAÇÃO
// ══════════════════════════════════════════

function lancarConfetti() {
  const colors = ['#ff6b35','#ffd700','#00e5ff','#39ff14','#ff3366','#ff69b4','#9b59b6'];
  const shapes = ['■', '●', '▲', '◆'];
  const overlay = document.getElementById('celebration-overlay');

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-v2';
    const size = 6 + Math.random() * 10;
    el.style.cssText = 'left:' + (Math.random()*100) + 'vw;' +
      'width:' + size + 'px;height:' + size + 'px;' +
      'background:' + colors[Math.floor(Math.random()*colors.length)] + ';' +
      'animation-delay:' + (Math.random()*1.5) + 's;' +
      'animation-duration:' + (2+Math.random()*2) + 's;' +
      'border-radius:' + (Math.random()>0.5?'50%':'2px') + ';';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

function lancarBaloes(quantidade) {
  quantidade = quantidade || 12;
  const emojis = ['🎈','🎈','🎈','🎉','🎊','🎈','🎈','🎈','🎊','🎉'];
  const cores  = ['🔴','🔵','🟡','🟢','🟠','🟣'];
  const todos  = [...emojis, ...cores];

  for (let i = 0; i < quantidade; i++) {
    const el = document.createElement('div');
    el.className = 'balao';
    el.textContent = todos[Math.floor(Math.random() * todos.length)];
    el.style.cssText = 'left:' + (5 + Math.random()*90) + 'vw;' +
      'animation-delay:' + (Math.random()*2) + 's;' +
      'animation-duration:' + (4+Math.random()*3) + 's;' +
      'font-size:' + (1.8+Math.random()*1.2) + 'rem;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  }
}

function lancarEstrelas() {
  const emojis = ['⭐','✨','🌟','💫','⭐','✨'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'estrela-celebracao';
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    el.style.cssText = 'left:' + (10+Math.random()*80) + 'vw;' +
      'top:' + (10+Math.random()*60) + 'vh;' +
      'animation-delay:' + (Math.random()*0.8) + 's;' +
      'animation-duration:' + (1+Math.random()*0.5) + 's;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

function celebracaoCompleta(nivel) {
  // nivel: 'ouro' (perfeito), 'prata' (bom), 'bronze' (concluiu)
  if (nivel === 'ouro') {
    lancarConfetti();
    lancarBaloes(16);
    lancarEstrelas();
    setTimeout(() => lancarBaloes(8), 1500);
    setTimeout(() => lancarEstrelas(), 800);
  } else if (nivel === 'prata') {
    lancarConfetti();
    lancarBaloes(8);
    lancarEstrelas();
  } else {
    lancarConfetti();
    lancarBaloes(4);
  }
}

function animarTrofeu(elementId, ganhou) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = ganhou ? 'trophy-pulse' : '';
  // Reiniciar animação
  void el.offsetWidth;
  el.className = ganhou ? 'trophy-pulse' : 'trophy-winner';
}

// ══════════════════════════════════════════
//  BATALHA
// ══════════════════════════════════════════
let batalhaLevel = 1;

function irParaBatalha() {
  renderPlayerBar('batalha');
  mostrarTela('screen-batalha');
}

function setBatalhaLevel(lv) {
  batalhaLevel = lv;
  document.getElementById('nivel-batalha-selecionado').textContent =
    lv === 1 ? '📊 Nível 1 selecionado' : '🎲 Nível 2 selecionado';
  document.querySelectorAll('#screen-batalha .btn-level').forEach((b, i) => {
    b.style.borderColor = (i + 1 === lv) ? 'var(--accent)' : 'rgba(255,255,255,0.08)';
  });
}

async function criarSala() {
  if (!jogadorId) { toast('Volte ao menu e entre novamente', 'err'); return; }
  toast('Criando sala...', 'inf');
  
  BATALHA.on('onSalaCriada', (data) => {
    salaAtual = { codigo: data.codigo, nivel: data.sala.nivel, criador: { id: jogadorId, nome: jogador.nome, avatar: jogador.avatar }, jogadores: [] };
    document.getElementById('codigo-sala-display').textContent = data.codigo;
    renderJogadoresSala([{ nome: jogador.nome, avatar: jogador.avatar, finalized: false }]);
    mostrarTela('screen-sala');
  });

  BATALHA.on('onJogadorEntrou', (data) => {
    if (salaAtual) {
      salaAtual.jogadores = salaAtual.jogadores || [];
      salaAtual.jogadores.push({ nome: data.nome, avatar: data.avatar });
      renderJogadoresSala([salaAtual.criador, ...salaAtual.jogadores]);
    }
  });

  BATALHA.on('onBatalhaIniciada', (data) => {
    iniciarJogoBatalha(data.nivel);
  });

  BATALHA.on('onAdversarioDesconectou', () => {
    toast('Adversário desconectou!', 'err');
    clearInterval(pollingInterval);
    salaAtual = null;
    irParaBatalha();
  });
  
  BATALHA.criarSala(jogadorId, jogador.nome, jogador.avatar, batalhaLevel);
}

async function entrarSala() {
  const codigo = document.getElementById('inp-codigo-sala').value.trim().toUpperCase();
  if (codigo.length < 5) { toast('Digite o código da sala', 'err'); return; }
  if (!jogadorId) { toast('Volte ao menu e entre novamente', 'err'); return; }
  toast('Entrando na sala...', 'inf');
  
  BATALHA.on('onSalaEncontrada', (data) => {
    salaAtual = data.sala;
    batalhaLevel = data.sala.nivel;
    document.getElementById('codigo-sala-display').textContent = data.codigo;
    const lista = [salaAtual.criador, ...(salaAtual.jogadores || [])];
    renderJogadoresSala(lista);
    mostrarTela('screen-sala');
  });

  BATALHA.on('onBatalhaIniciada', (data) => {
    iniciarJogoBatalha(data.nivel);
  });

  BATALHA.on('onAdversarioDesconectou', () => {
    toast('Adversário desconectou!', 'err');
    clearInterval(pollingInterval);
    salaAtual = null;
    irParaBatalha();
  });
  
  BATALHA.entrarSala(codigo, jogadorId, jogador.nome, jogador.avatar);
}

function renderJogadoresSala(jogadores) {
  const el = document.getElementById('lista-jogadores-sala');
  if (!jogadores || jogadores.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted)">Nenhum jogador</div>';
    return;
  }
  el.innerHTML = jogadores.map(j => `
    <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06)">
      <span style="font-size:1.6rem">${j.avatar || '🦁'}</span>
      <span style="font-weight:700">${j.nome}</span>
      ${j.finalizado ? '<span style="color:var(--green); margin-left:auto">✅ Pronto</span>' : ''}
    </div>
  `).join('');

  const btnIniciar = document.getElementById('btn-iniciar-batalha');
  const msg = document.getElementById('sala-status-msg');
  if (jogadores.length >= 2) {
    btnIniciar.style.display = 'block';
    msg.textContent = 'Sala completa! Clique em Iniciar quando todos estiverem prontos.';
    msg.style.color = 'var(--green)';
  } else {
    btnIniciar.style.display = 'none';
    msg.textContent = 'Aguardando adversário entrar na sala...';
    msg.style.color = 'var(--muted)';
  }
}

function iniciarPolling(codigo) {
  clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    try {
      const r = await fetch(CONFIG.API_URL + '/batalha/' + codigo);
      const d = await r.json();
      if (!r.ok) return;
      salaAtual = d;

      const telaAtual = document.querySelector('.screen.active');
      const idAtual = telaAtual ? telaAtual.id : '';

      // Na sala de espera → atualizar lista
      if (idAtual === 'screen-sala') {
        renderJogadoresSala(d.jogadores);
      }

      // Na tela aguardando → atualizar placar parcial
      if (idAtual === 'screen-aguardando') {
        const finalizados = d.jogadores.filter(j => j.finalizado);
        const el = document.getElementById('aguardando-placar');
        if (el && finalizados.length > 0) {
          el.innerHTML = '<div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Já finalizaram</div>' +
            finalizados.map(j => '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:6px">' +
              '<span>' + (j.avatar||'🦁') + '</span>' +
              '<span style="flex:1;font-weight:700">' + j.nome + '</span>' +
              '<span style="font-family:Boogaloo,cursive;color:var(--accent2)">' + formatarTempo(j.tempo) + '</span>' +
            '</div>').join('');
        }
      }

      // Jogo em andamento → iniciar
      if (d.status === 'em_jogo' && !jogoAtivo) {
        clearInterval(pollingInterval);
        iniciarJogoBatalha(d.nivel);
        return;
      }

      // Todos finalizaram → mostrar resultado
      if (d.status === 'finalizada') {
        clearInterval(pollingInterval);
        setTimeout(() => mostrarResultadoBatalha(d.jogadores), 500);
        return;
      }
    } catch(e) {}
  }, 2000);
}

async function iniciarBatalha() {
  if (!salaAtual) return;
  BATALHA.iniciarBatalha();
}

function iniciarJogoBatalha(nivel) {
  clearInterval(pollingInterval);
  const jogadoresSala = salaAtual ? [salaAtual.criador, ...(salaAtual.jogadores || [])] : [];
  mostrarCountdown(3, jogadoresSala, () => {
    modoAtual = 'batalha';
    iniciarJogo(nivel);
  });
}

async function enviarResultadoBatalha() {
  if (!salaAtual || !jogadorId) return;

  pararMusica();
  mostrarTela('screen-aguardando');

  BATALHA.finalizarBatalha(segundos, acertos, erros);

  BATALHA.on('onJogadorFinalizou', (data) => {
    const el = document.getElementById('aguardando-placar');
    if (el) {
      el.innerHTML = '<div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Já finalizaram</div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:6px">' +
        '<span>' + (jogador.avatar || '🦁') + '</span>' +
        '<span style="flex:1;font-weight:700">' + data.nome + '</span>' +
        '<span style="font-family:Boogaloo,cursive;color:var(--accent2)">' + formatarTempo(data.tempo) + '</span>' +
        '</div>';
    }
  });

  BATALHA.on('onBatalhaFinalizada', (data) => {
    setTimeout(() => mostrarResultadoBatalha(data.resultados), 500);
  });
}

function mostrarResultadoBatalha(jogadoresList) {
  clearInterval(pollingInterval);
  // Ordenar por tempo
  const finalizados = jogadoresList.filter(j => j.finalizado && j.tempo !== null);
  finalizados.sort((a, b) => a.tempo - b.tempo);
  const eu = jogadoresList.find(j => j.id === jogadorId);
  const vencedor = finalizados[0];
  const ganhei = vencedor && vencedor.id === jogadorId;

  // Parar música ao mostrar resultado
  pararMusica();

  // Troféu
  const trofeuBat = document.getElementById('batalha-trophy');
  trofeuBat.textContent = ganhei ? '🏆' : '💪';
  setTimeout(() => animarTrofeu('batalha-trophy', ganhei), 200);

  // Título
  document.getElementById('batalha-resultado-titulo').innerHTML = ganhei
    ? '<span style="color:var(--accent2)">VOCÊ VENCEU!</span>'
    : '<span style="color:var(--muted)">Boa batalha!</span>';

  // Mensagem personalizada
  const msgEl = document.getElementById('batalha-mensagem');
  if (msgEl) {
    const msgsPerdedor = [
      '💡 Quase lá! Da próxima você vence!',
      '🔥 Você foi incrível! Bora revanche?',
      '💪 Cada treino te deixa mais forte!',
      '⭐ A tabuada te espera de volta!',
      '🎯 Continue treinando, você consegue!'
    ];
    msgEl.textContent = ganhei
      ? 'Parabéns! Você dominou a tabuada! 🎉'
      : msgsPerdedor[Math.floor(Math.random() * msgsPerdedor.length)];
  }

  // Banner
  const bannerBat = document.getElementById('batalha-banner');
  if (bannerBat) {
    bannerBat.innerHTML = ganhei
      ? '<div class="banner-vencedor">🏆 CAMPEÃO DA BATALHA! 🏆</div>'
      : '<div class="banner-vencedor" style="background:linear-gradient(135deg,#2d2d44,#1a1830);color:var(--accent3);border:1px solid var(--accent3)">💪 NÃO DESISTA! REVANCHE! 💪</div>';
  }

  // Placar com estilo
  const placarEl = document.getElementById('batalha-placar');
  placarEl.innerHTML = finalizados.map((j, i) => {
    const eVoce = j.id === jogadorId;
    const medalha = i===0?'🥇':i===1?'🥈':'🥉';
    return '<div class="placar-item ' + (i===0?'primeiro':'segundo') + '" style="animation-delay:' + (i*0.15) + 's">' +
      '<div style="font-size:1.6rem">' + medalha + '</div>' +
      '<div style="font-size:1.4rem">' + (j.avatar||'🦁') + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-weight:700">' + j.nome + (eVoce?' <span style="color:var(--accent);font-size:0.75rem">(você)</span>':'') + '</div>' +
        '<div style="font-size:0.72rem; color:var(--muted)">' + (j.acertos||0) + ' acertos · ' + (j.erros||0) + ' erros</div>' +
      '</div>' +
      '<div style="font-family:Boogaloo,cursive; font-size:1.2rem; color:' + (i===0?'var(--accent2)':'var(--accent3)') + '">' + formatarTempo(j.tempo) + '</div>' +
    '</div>';
  }).join('');

  mostrarTela('screen-resultado-batalha');
  setTimeout(() => {
    if (ganhei) {
      celebracaoCompleta('ouro');
      tocarVitoria();
    } else {
      lancarConfetti();
      lancarBaloes(4);
      lancarEstrelas();
    }
  }, 400);
}

function copiarCodigo() {
  const codigo = document.getElementById('codigo-sala-display').textContent;
  navigator.clipboard.writeText(codigo).then(() => toast('Código copiado! 📋', 'ok')).catch(() => {
    toast(codigo, 'ok');
  });
}

function sairDaSala() {
  clearInterval(pollingInterval);
  BATALHA.sairSala();
  BATALHA.disconnect();
  salaAtual = null;
  irParaBatalha();
}
