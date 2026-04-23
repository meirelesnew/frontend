import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inicializa o Firebase usando a config do window
const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);

// --- MANTEMOS AS FUNÇÕES DE LOCALSTORAGE QUE VOCÊ JÁ TEM ---
function getRanking(lv) {
  try { return JSON.parse(localStorage.getItem('tt_ranking_' + lv) || '[]'); }
  catch { return []; }
}

// --- ATUALIZAMOS A FUNÇÃO SALVAR ---
async function salvarRanking(entrada) {
  // 1. Salva no Local (como você já fazia)
  const rank = getRanking(entrada.nivel);
  rank.push(entrada);
  rank.sort((a, b) => a.tempo - b.tempo);
  localStorage.setItem('tt_ranking_' + entrada.nivel, JSON.stringify(rank.slice(0, 50)));

  // 2. Salva no Firebase Firestore
  try {
    await addDoc(collection(db, "ranking"), {
      nome: entrada.nome,
      avatar: entrada.avatar || '🦁',
      nivel: Number(entrada.nivel),
      tempo: Number(entrada.tempo),
      acertos: Number(entrada.acertos),
      erros: Number(entrada.erros),
      modo: 'solo',
      data: new Date().toLocaleDateString('pt-BR')
    });
    console.log("Salvo no Firebase!");
    renderRankList(tabAtiva);
  } catch (e) {
    console.error("Erro ao salvar no Firebase:", e);
  }
}

// --- ATUALIZAMOS A FUNÇÃO DE RENDERIZAR ---
async function renderRankList(lv) {
  const el = document.getElementById('rank-list');
  if (!el) return;

  el.innerHTML = '<div class="rank-empty" style="color:var(--accent3)">⏳ Carregando...</div>';

  try {
    const rankingRef = collection(db, "ranking");
    let q;

    // Se lv for 0 (Todos), buscamos geral. Se for 1 ou 2, filtramos.
    if (lv === 0) {
      q = query(rankingRef, orderBy("tempo", "asc"), limit(50));
    } else {
      q = query(rankingRef, where("nivel", "==", lv), orderBy("tempo", "asc"), limit(50));
    }

    const querySnapshot = await getDocs(q);
    const dadosFirebase = [];
    querySnapshot.forEach((doc) => dadosFirebase.push(doc.data()));

    if (dadosFirebase.length > 0) {
      el.innerHTML = _htmlItens(dadosFirebase, lv);
    } else {
      _mostrarLocal(el, lv, false);
    }
  } catch (error) {
    console.error("Erro ao buscar no Firebase, usando local:", error);
    _mostrarLocal(el, lv, true);
  }
}

// As funções _mostrarLocal, _htmlItens e limparRanking permanecem IGUAIS 
// ao que você já tem no seu arquivo original.
