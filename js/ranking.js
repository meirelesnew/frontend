// ══════════════════════════════════════════
//  RANKING.JS — v2 com fallback robusto
// ══════════════════════════════════════════

// ── Local (localStorage) ──────────────────
function getRanking(lv) {
  try { return JSON.parse(localStorage.getItem(`tt_ranking_${lv}`) || '[]'); }
  catch { return []; }
}

// ── Salvar local + API ────────────────────
function salvarRanking(entrada) {
  // 1. Local sempre
  const rank = getRanking(entrada.nivel);
  rank.push(entrada);
  rank.sort((a, b) => a.tempo - b.tempo);
  localStorage.setItem('tt_ranking_' + entrada.nivel, JSON.stringify(rank.slice(0, 50)));

  // 2. API — com jogadorId garantido
  const jid = (typeof jogadorId !== 'undefined' && jogadorId)
    || localStorage.getItem('tt_jogador_id')
    || 'anonimo-' + Date.now().toString(36);

  API.salvarRanking({
    jogador_id: jid,
    nome:    entrada.nome,
    avatar:  entrada.avatar,
    nivel:   Number(entrada.nivel),
    tempo:   Number(entrada.tempo),
    acertos: Number(entrada.acertos),
    erros:   Number(entrada.erros),
    modo:    'solo'
  })
  .then(() => { if (typeof tabAtiva !== 'undefined') renderRankList(tabAtiva); })
  .catch(e  => console.warn('[RANKING] offline — local ok:', e.message));
}

// ── Renderizar ────────────────────────────
let tabAtiva = 1;

function switchTab(lv) {
  tabAtiva = lv;
  ['tab-n1','tab-n2','tab-all'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', [1, 2, 0][i] === lv);
  });
  renderRankList(lv);
}

function renderRankList(lv) {
  const el = document.getElementById('rank-list');
  if (!el) return;

  el.innerHTML = '<div class="rank-empty" style="color:var(--accent3)">🌐 Carregando ranking... ⏳</div>';

  // BUG FIX #1: timeout de 6s — se a API não responder, cai no fallback local
  const timeout = setTimeout(() => {
    console.warn('[RANKING] Timeout — exibindo local');
    el.innerHTML = '<div class="rank-empty" style="color:var(--accent);font-size:.8rem;margin-bottom:8px">⚠️ Servidor lento. Exibindo dados locais.</div>';
    renderRankLocal(lv);
  }, 6000);

  API.getRanking(lv === 1 ? 1 : lv === 2 ? 2 : 0)
    .then(d => {
      clearTimeout(timeout);
      if (d && d.ranking && d.ranking.length > 0) {
        renderRankItems(d.ranking.slice(0, 50), lv);
      } else {
        // BUG FIX #2: API ok mas sem dados — mostra local ou vazio real
        const local = getRanking(lv);
        if (local.length > 0) {
          el.innerHTML = '<div style="color:var(--muted);font-size:.75rem;text-align:center;padding:8px 0 4px">📱 Dados locais</div>';
          renderRankLocal(lv);
        } else {
          el.innerHTML = '<div class="rank-empty">Nenhuma partida ainda.<br>🚀 Seja o primeiro!</div>';
        }
      }
    })
    .catch(err => {
      clearTimeout(timeout);
      console.error('[RANKING] Erro na API:', err.message || err);
      // BUG FIX #3: fallback imediato para local sem travar tela
      const local = getRanking(lv);
      if (local.length > 0) {
        el.innerHTML = '<div style="color:var(--accent);font-size:.75rem;text-align:center;padding:8px 0 4px">⚠️ Offline — dados locais</div>';
        renderRankLocal(lv);
      } else {
        el.innerHTML = '<div class="rank-empty">⚠️ Sem conexão.<br>Jogue uma partida para ver seu resultado aqui!</div>';
      }
    });
}

function renderRankLocal(lv) {
  const el = document.getElementById('rank-list');
  if (!el) return;
  let items = [];
  if (lv === 0) {
    const r1 = getRanking(1).map(r => ({...r, _lv:1}));
    const r2 = getRanking(2).map(r => ({...r, _lv:2}));
    items = [...r1, ...r2].sort((a, b) => a.tempo - b.tempo).slice(0, 20);
  } else {
    items = getRanking(lv).slice(0, 20);
  }
  // Adiciona itens ao que já está no container (não sobrescreve o aviso)
  const list = document.createElement('div');
  list.innerHTML = renderRankItemsHTML(items, lv);
  el.appendChild(list);
}

function renderRankItems(items, lv) {
  const el = document.getElementById('rank-list');
  if (!el) return;
  el.innerHTML = renderRankItemsHTML(items, lv);
}

function renderRankItemsHTML(items, lv) {
  if (!items || items.length === 0) {
    return '<div class="rank-empty">Nenhum resultado ainda. Seja o primeiro! 🚀</div>';
  }
  return items.map((r, i) => {
    const posClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const medal    = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const lvTag    = lv===0
      ? `<span style="color:var(--accent);font-size:.65rem"> · Nv${r._lv||r.nivel}</span>` : '';
    const modoTag  = r.modo==='batalha'
      ? ' <span style="color:var(--accent3);font-size:.65rem">⚔️</span>' : '';
    return `<div class="rank-item">
      <div class="rank-pos ${posClass}">${medal}</div>
      <div class="rank-av">${r.avatar||'🦁'}</div>
      <div class="rank-info">
        <div class="rank-name">${r.nome||'—'}${lvTag}${modoTag}</div>
        <div class="rank-meta">${r.acertos||0} acertos · ${r.erros||0} erros · ${r.data||''}</div>
      </div>
      <div class="rank-time">${formatarTempo(r.tempo)}</div>
    </div>`;
  }).join('');
}

function limparRanking() {
  localStorage.removeItem('tt_ranking_1');
  localStorage.removeItem('tt_ranking_2');
  renderRankList(tabAtiva);
  if (typeof toast === 'function') toast('Ranking limpo! 🗑', 'ok');
}
