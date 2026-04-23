// ══════════════════════════════════════════════════════
//  RANKING.JS — funciona com ou sem backend
// ══════════════════════════════════════════════════════

// ── LocalStorage ──────────────────────────────────────
function getRanking(lv) {
  try { return JSON.parse(localStorage.getItem('tt_ranking_' + lv) || '[]'); }
  catch { return []; }
}

// ── Salvar (local SEMPRE + API se disponível) ─────────
function salvarRanking(entrada) {
  // 1. Local — nunca falha
  const rank = getRanking(entrada.nivel);
  rank.push(entrada);
  rank.sort((a, b) => a.tempo - b.tempo);
  localStorage.setItem('tt_ranking_' + entrada.nivel, JSON.stringify(rank.slice(0, 50)));

  // 2. API — silencioso se offline
  const jid = (typeof jogadorId !== 'undefined' && jogadorId)
    || localStorage.getItem('tt_jogador_id')
    || ('anon_' + Date.now().toString(36));

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
  .catch(() => { /* silencioso — local já foi salvo */ });
}

// ── Tabs ──────────────────────────────────────────────
let tabAtiva = 1;

function switchTab(lv) {
  tabAtiva = lv;
  document.getElementById('tab-n1')?.classList.toggle('active', lv === 1);
  document.getElementById('tab-n2')?.classList.toggle('active', lv === 2);
  document.getElementById('tab-all')?.classList.toggle('active', lv === 0);
  renderRankList(lv);
}

// ── Renderizar ranking ────────────────────────────────
function renderRankList(lv) {
  const el = document.getElementById('rank-list');
  if (!el) return;

  el.innerHTML = '<div class="rank-empty" style="color:var(--accent3)">⏳ Carregando...</div>';

  // Timeout: 5s → cai no local sem esperar mais
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    _mostrarLocal(el, lv, true);
  }, 5000);

  API.getRanking(lv === 1 ? 1 : lv === 2 ? 2 : 0)
    .then(d => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (d && Array.isArray(d.ranking) && d.ranking.length > 0) {
        el.innerHTML = _htmlItens(d.ranking.slice(0, 50), lv);
      } else {
        _mostrarLocal(el, lv, false);
      }
    })
    .catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      _mostrarLocal(el, lv, true);
    });
}

function _mostrarLocal(el, lv, offline) {
  let items = [];
  if (lv === 0) {
    const r1 = getRanking(1).map(r => ({ ...r, _lv: 1 }));
    const r2 = getRanking(2).map(r => ({ ...r, _lv: 2 }));
    items = [...r1, ...r2].sort((a, b) => a.tempo - b.tempo).slice(0, 30);
  } else {
    items = getRanking(lv).slice(0, 30);
  }

  const aviso = offline
    ? '<div style="text-align:center;color:var(--muted);font-size:.75rem;padding:4px 0 8px">📱 Dados locais</div>'
    : '';

  el.innerHTML = aviso + (items.length > 0
    ? _htmlItens(items, lv)
    : '<div class="rank-empty">Nenhuma partida ainda.<br>🚀 Jogue e apareça aqui!</div>');
}

function _htmlItens(items, lv) {
  return items.map((r, i) => {
    const cls    = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
    const lvTag  = lv === 0
      ? `<span style="color:var(--accent);font-size:.65rem"> · Nv${r._lv || r.nivel}</span>` : '';
    const modo   = r.modo === 'batalha'
      ? ' <span style="color:var(--accent3);font-size:.65rem">⚔️</span>' : '';
    return `<div class="rank-item">
      <div class="rank-pos ${cls}">${medal}</div>
      <div class="rank-av">${r.avatar || '🦁'}</div>
      <div class="rank-info">
        <div class="rank-name">${r.nome || '—'}${lvTag}${modo}</div>
        <div class="rank-meta">${r.acertos || 0} acertos · ${r.erros || 0} erros · ${r.data || ''}</div>
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
