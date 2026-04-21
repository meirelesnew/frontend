// ══════════════════════════════════════════
//  RANKING
// ══════════════════════════════════════════
function getRanking(lv) {
  const key = `tt_ranking_${lv}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function salvarRanking(entrada) {
  // 1. Salvar local (fallback offline)
  const key = 'tt_ranking_' + entrada.nivel;
  const rank = getRanking(entrada.nivel);
  rank.push(entrada);
  rank.sort((a, b) => a.tempo - b.tempo);
  localStorage.setItem(key, JSON.stringify(rank.slice(0, 50)));

  // 2. Salvar na API — usa token JWT se logado via AUTH
  const usuario = null; // sem autenticação
  const jid = (typeof getOuCriarJogadorId === 'function') ? getOuCriarJogadorId() : (jogadorId || localStorage.getItem('tt_jogador_id') || 'anonimo');

  const payload = {
    jogador_id: jid,
    nome: entrada.nome,
    avatar: entrada.avatar,
    nivel: entrada.nivel,
    tempo: Number(entrada.tempo),
    acertos: Number(entrada.acertos),
    erros: Number(entrada.erros),
    modo: 'solo'
  };

  console.log('[RANKING] Enviando para API:', payload);
  API.salvarRanking(payload)
    .then(() => {
      console.log('[RANKING] ✅ Salvo na API — atualizando ranking global...');
      if (typeof tabAtiva !== 'undefined') renderRankList(tabAtiva);
    })
    .catch(e => console.warn('[RANKING] API offline — mantido local:', e.message));
}

let tabAtiva = 1;
function switchTab(lv) {
  tabAtiva = lv;
  document.getElementById('tab-n1').classList.toggle('active', lv === 1);
  document.getElementById('tab-n2').classList.toggle('active', lv === 2);
  document.getElementById('tab-all').classList.toggle('active', lv === 0);
  renderRankList(lv);
}

function renderRankList(lv) {
  const el = document.getElementById('rank-list');
  el.innerHTML = '<div class="rank-empty" style="color:var(--accent3)">🌐 Carregando ranking global... ⏳</div>';

  API.getRanking(lv === 1 ? 1 : lv === 2 ? 2 : 0)
    .then(d => {
      if (d.ranking && d.ranking.length > 0) {
        renderRankItems(d.ranking.slice(0, 50), lv);
      } else {
        // API online mas sem dados — mostrar vazio real
        el.innerHTML = '<div class="rank-empty">Nenhuma partida registrada ainda.<br>🚀 Seja o primeiro a jogar!</div>';
      }
    })
    .catch(err => {
      console.error('[RANKING] ERRO ao buscar ranking global:', err);
      el.innerHTML = '<div class="rank-empty" style="color:var(--accent);font-size:0.8rem;margin-bottom:8px">⚠️ Sem conexão com o servidor.<br>Exibindo dados locais.</div>';
      renderRankLocal(lv);
    });
}

function renderRankLocal(lv) {
  let items = [];
  if (lv === 0) {
    const r1 = getRanking(1).map(r => ({...r, _lv:1}));
    const r2 = getRanking(2).map(r => ({...r, _lv:2}));
    items = [...r1, ...r2].sort((a,b) => a.tempo-b.tempo).slice(0,20);
  } else {
    items = getRanking(lv).slice(0,20);
  }
  renderRankItems(items, lv);
}

function renderRankItems(items, lv) {
  const el = document.getElementById('rank-list');
  if (!items || items.length === 0) {
    el.innerHTML = '<div class="rank-empty">Nenhum resultado ainda.<br>Seja o primeiro! 🚀</div>';
    return;
  }
  el.innerHTML = items.map((r, i) => {
    const posClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const posMedal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const lvTag = lv===0 ? '<span style="color:var(--accent);font-size:0.65rem"> · Nv'+(r._lv||r.nivel)+'</span>' : '';
    const modoTag = r.modo==='batalha' ? ' <span style="color:var(--accent3);font-size:0.65rem">⚔️</span>' : '';
    return '<div class="rank-item">' +
      '<div class="rank-pos '+posClass+'">'+posMedal+'</div>' +
      '<div class="rank-av">'+(r.avatar||'🦁')+'</div>' +
      '<div class="rank-info">' +
        '<div class="rank-name">'+r.nome+lvTag+modoTag+'</div>' +
        '<div class="rank-meta">'+(r.acertos||0)+' acertos · '+(r.erros||0)+' erros · '+(r.data||'')+'</div>' +
      '</div>' +
      '<div class="rank-time">'+formatarTempo(r.tempo)+'</div>' +
    '</div>';
  }).join('');
}

function limparRanking() {
  localStorage.removeItem('tt_ranking_1');
  localStorage.removeItem('tt_ranking_2');
  renderRankList(tabAtiva);
  toast('Ranking limpo! 🗑', 'ok');
}
