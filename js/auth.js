// ═══════════════════════════════════════════════════════════════
// AUTH.JS — Sistema de autenticação do Tabuada Turbo
// Gerencia: token JWT, login, registro, logout, modal de auth
// ═══════════════════════════════════════════════════════════════

const AUTH = (() => {
  const TOKEN_KEY = "tt_token";
  const USER_KEY  = "tt_user";

  // ── Armazenamento de token ─────────────────────────────────
  function salvarToken(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function estaLogado() {
    return !!getToken();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Limpar estado global do jogo se existir
    if (typeof jogador !== 'undefined') {
      jogador.nome = '';
      jogador.avatar = '🦁';
      localStorage.removeItem('tt_jogador');
      localStorage.removeItem('tt_jogador_id');
      if (typeof jogadorId !== 'undefined') window.jogadorId = null;
    }

    atualizarBotaoAuth();
    if (typeof toast === 'function') toast('👋 Até logo!', 'ok');
    
    // Redirecionar para tela inicial se estiver no jogo
    if (typeof mostrarTela === 'function') mostrarTela('screen-entrada');
  }

  // ── API calls ──────────────────────────────────────────────
  async function registrar(nome, email, senha) {
    const res = await fetch(`${CONFIG.API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao registrar");
    return data;
  }

  async function login(email, senha) {
    console.log('[AUTH] Tentando login:', email);
    const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });
    const data = await res.json();
    console.log('[AUTH] Resposta login:', res.status, data);
    if (!res.ok) throw new Error(data.message || "Email ou senha incorretos");
    return data;
  }

  // ── Modal de auth ──────────────────────────────────────────
  function criarModal() {
    if (document.getElementById("auth-modal")) return;

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.innerHTML = `
      <div id="auth-backdrop" onclick="AUTH.fecharModal()"></div>
      <div id="auth-box">
        <button id="auth-close" onclick="AUTH.fecharModal()">✕</button>

        <!-- Abas -->
        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login" onclick="AUTH.mostrarAba('login')">Entrar</button>
          <button class="auth-tab" id="tab-register" onclick="AUTH.mostrarAba('register')">Criar conta</button>
        </div>

        <!-- Painel Login -->
        <div id="auth-panel-login" class="auth-panel">
          <p class="auth-subtitle">🏆 Salve seus recordes com seu nome permanente!</p>
          <div class="auth-field">
            <label class="field-label">Email</label>
            <input type="email" id="login-email" placeholder="seu@email.com" autocomplete="email">
          </div>
          <div class="auth-field">
            <label class="field-label">Senha</label>
            <div style="position:relative">
              <input type="password" id="login-senha" placeholder="••••••" autocomplete="current-password" style="padding-right:2.8rem">
              <button type="button" onclick="AUTH.toggleSenha('login-senha', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--muted,#aaa)">👁</button>
            </div>
          </div>
          <p id="auth-error-login" class="auth-error"></p>
          <button class="btn btn-primary" id="btn-login" onclick="AUTH.fazerLogin()">🚀 Entrar</button>
          
          <p class="auth-switch">Não tem conta? <a href="#" onclick="AUTH.mostrarAba('register');return false;">Crie agora</a></p>
          <p class="auth-switch"><a href="#" onclick="AUTH.mostrarAba('recuperar');return false;" style="color:var(--muted,#aaa);font-size:.8rem">Esqueci minha senha</a></p>
        </div>

        <!-- Painel Recuperação de Senha -->
        <div id="auth-panel-recuperar" class="auth-panel" style="display:none">
          <p class="auth-subtitle">🔑 Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
          <div class="auth-field">
            <label class="field-label">E-mail da conta</label>
            <input type="email" id="rec-email" placeholder="seu@email.com" autocomplete="email">
          </div>
          <p id="auth-error-recuperar" class="auth-error"></p>
          <p id="auth-ok-recuperar" style="color:#00e5ff;font-size:.85rem;min-height:16px;margin:-8px 0 10px"></p>
          <button class="btn btn-primary" id="btn-recuperar" onclick="AUTH.solicitarRecuperacao()">📧 Enviar link</button>
          <p class="auth-switch">Lembrou a senha? <a href="#" onclick="AUTH.mostrarAba('login');return false;">Voltar ao login</a></p>
        </div>

        <!-- Painel Confirmar Conta -->
        <div id="auth-panel-confirmar" class="auth-panel" style="display:none">
          <p class="auth-subtitle">📬 Verifique seu e-mail e cole o link de confirmação abaixo.</p>
          <div class="auth-field">
            <label class="field-label">Código / Token do e-mail</label>
            <input type="text" id="conf-token" placeholder="Cole o token aqui...">
          </div>
          <p id="auth-error-confirmar" class="auth-error"></p>
          <p id="auth-ok-confirmar" style="color:#00e5ff;font-size:.85rem;min-height:16px;margin:-8px 0 10px"></p>
          <button class="btn btn-primary" id="btn-confirmar" onclick="AUTH.confirmarConta()">✅ Confirmar conta</button>
          <p class="auth-switch"><a href="#" onclick="AUTH.reenviarConfirmacao();return false;">Não recebi o e-mail — reenviar</a></p>
          <p class="auth-switch"><a href="#" onclick="AUTH.mostrarAba('login');return false;">← Voltar ao login</a></p>
        </div>

        <!-- Painel Redefinir Senha (chegou do link do email) -->
        <div id="auth-panel-redefinir" class="auth-panel" style="display:none">
          <p class="auth-subtitle">🔑 Crie uma nova senha para sua conta.</p>
          <input type="hidden" id="red-token">
          <div class="auth-field">
            <label class="field-label">Nova senha (mín. 6 caracteres)</label>
            <div style="position:relative">
              <input type="password" id="red-nova" placeholder="••••••" style="padding-right:2.8rem">
              <button type="button" onclick="AUTH.toggleSenha('red-nova',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--muted,#aaa)">👁</button>
            </div>
          </div>
          <div class="auth-field">
            <label class="field-label">Confirmar nova senha</label>
            <div style="position:relative">
              <input type="password" id="red-nova-confirm" placeholder="••••••" style="padding-right:2.8rem">
              <button type="button" onclick="AUTH.toggleSenha('red-nova-confirm',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--muted,#aaa)">👁</button>
            </div>
          </div>
          <p id="auth-error-redefinir" class="auth-error"></p>
          <p id="auth-ok-redefinir" style="color:#00e5ff;font-size:.85rem;min-height:16px;margin:-8px 0 10px"></p>
          <button class="btn btn-primary" id="btn-redefinir" onclick="AUTH.redefinirSenha()">🔑 Salvar nova senha</button>
        </div>

        <!-- Painel Registro -->
        <div id="auth-panel-register" class="auth-panel" style="display:none">
          <p class="auth-subtitle">🎮 Crie sua conta grátis e entre no ranking global!</p>
          <div class="auth-field">
            <label class="field-label">Apelido no jogo</label>
            <input type="text" id="reg-nome" placeholder="Como você quer ser chamado?" maxlength="20">
          </div>
          <div class="auth-field">
            <label class="field-label">Email</label>
            <input type="email" id="reg-email" placeholder="seu@email.com" autocomplete="email">
          </div>
          <div class="auth-field">
            <label class="field-label">Senha (mín. 6 caracteres)</label>
            <div style="position:relative">
              <input type="password" id="reg-senha" placeholder="••••••" autocomplete="new-password" style="padding-right:2.8rem">
              <button type="button" onclick="AUTH.toggleSenha('reg-senha', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--muted,#aaa)">👁</button>
            </div>
          </div>
          <div class="auth-field">
            <label class="field-label">Confirmar senha</label>
            <div style="position:relative">
              <input type="password" id="reg-senha-confirm" placeholder="••••••" autocomplete="new-password" style="padding-right:2.8rem">
              <button type="button" onclick="AUTH.toggleSenha('reg-senha-confirm', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--muted,#aaa)">👁</button>
            </div>
          </div>
          <p id="auth-error-register" class="auth-error"></p>
          <button class="btn btn-primary" id="btn-register" onclick="AUTH.fazerRegistro()">✨ Criar conta</button>
          
          <p class="auth-switch">Já tem conta? <a href="#" onclick="AUTH.mostrarAba('login');return false;">Entrar</a></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Enter key shortcuts
    document.getElementById("login-senha").addEventListener("keydown", e => {
      if (e.key === "Enter") AUTH.fazerLogin();
    });
    document.getElementById("reg-senha").addEventListener("keydown", e => {
      if (e.key === "Enter") AUTH.fazerRegistro();
    });
  }

  function abrirModal(aba = "login") {
    criarModal();
    mostrarAba(aba);
    document.getElementById("auth-modal").classList.add("active");
    setTimeout(() => {
      const input = aba === "login"
        ? document.getElementById("login-email")
        : document.getElementById("reg-nome");
      if (input) input.focus();
    }, 100);
  }

  function fecharModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
  }

  function mostrarAba(aba) {
    const paineis = ["login", "register", "recuperar", "confirmar", "redefinir"];
    paineis.forEach(p => {
      const el = document.getElementById(`auth-panel-${p}`);
      if (el) el.style.display = aba === p ? "" : "none";
    });
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    const tabEl = document.getElementById(`tab-${aba}`);
    if (tabEl) tabEl.classList.add("active");
  }

  // ── Ações ──────────────────────────────────────────────────
  async function fazerLogin() {
    const btn   = document.getElementById("btn-login");
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;
    const errEl = document.getElementById("auth-error-login");

    errEl.textContent = "";
    if (!email || !senha) { errEl.textContent = "Preencha todos os campos."; return; }

    btn.disabled = true;
    btn.textContent = "Entrando...";
    try {
      const data = await login(email, senha);
      salvarToken(data.token, data.usuario);
      
      const anonId = localStorage.getItem('tt_jogador_id');
      data.usuario.jogador_id = data.usuario.id;
      if (anonId && anonId.startsWith('anon_')) {
        try {
          await API.salvarJogador({
            jogador_id: data.usuario.id,
            source_jogador_id: anonId,
            nome: data.usuario.nome,
            avatar: data.usuario.avatar || '🦁'
          });
          localStorage.removeItem('tt_jogador_id');
        } catch (e) {
          console.warn('[MIGRAÇÃO] Erro ao migrar:', e.message);
        }
      }

      fecharModal();
      atualizarBotaoAuth();
      if (typeof toast === 'function') toast(`✅ Bem-vindo, ${data.usuario.nome}!`, 'ok');
      if (typeof irParaMenu === 'function') {
        if (typeof jogador !== 'undefined') {
          jogador.nome   = data.usuario.nome;
          jogador.avatar = data.usuario.avatar || '🦁';
        }
        const inpNome = document.getElementById('inp-nome');
        if (inpNome) inpNome.value = data.usuario.nome;
        const avBtns = document.querySelectorAll('.av-btn');
        avBtns.forEach(b => {
          b.classList.toggle('selected', b.textContent === (data.usuario.avatar || '🦁'));
        });
        setTimeout(() => irParaMenu(), 300);
      }
    } catch (e) {
      console.error('[AUTH] Erro login:', e.message);
      errEl.textContent = e.message;
      if (typeof toast === 'function') toast('❌ ' + e.message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 Entrar";
    }
  }

  async function fazerRegistro() {
    const btn   = document.getElementById("btn-register");
    const nome  = document.getElementById("reg-nome").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const senha = document.getElementById("reg-senha").value;
    const errEl = document.getElementById("auth-error-register");

    const senhaConfirm = document.getElementById("reg-senha-confirm")?.value || "";
    errEl.textContent = "";
    if (!nome || !email || !senha) { errEl.textContent = "Preencha todos os campos."; return; }
    if (senha.length < 6) { errEl.textContent = "Senha precisa ter pelo menos 6 caracteres."; return; }
    if (senha !== senhaConfirm) { errEl.textContent = "As senhas não coincidem."; return; }

    btn.disabled = true;
    btn.textContent = "Criando conta...";
    try {
      const data = await registrar(nome, email, senha);
      salvarToken(data.token, data.usuario);
      
      const anonId = localStorage.getItem('tt_jogador_id');
      data.usuario.jogador_id = data.usuario.id;
      if (anonId && anonId.startsWith('anon_')) {
        try {
          await API.salvarJogador({
            jogador_id: data.usuario.id,
            source_jogador_id: anonId,
            nome: data.usuario.nome,
            avatar: data.usuario.avatar || '🦁'
          });
          localStorage.removeItem('tt_jogador_id');
        } catch (e) {
          console.warn('[MIGRAÇÃO] Erro ao migrar:', e.message);
        }
      }

      fecharModal();
      atualizarBotaoAuth();
      if (typeof toast === 'function') toast(`🎉 Conta criada! Confirme seu e-mail.`, 'ok');
      mostrarAba('confirmar');
      const okEl = document.getElementById('auth-ok-confirmar');
      if (okEl) okEl.textContent = `📬 Enviamos um e-mail para ${data.usuario.email}. Verifique sua caixa de entrada!`;
    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "✨ Criar conta";
    }
  }

  // ── Botão de auth no header ────────────────────────────────
  function atualizarBotaoAuth() {
    const btn = document.getElementById("btn-auth-header");
    if (!btn) return;
    const user = getUser();
    if (user) {
      btn.textContent = `👤 ${user.nome}`;
      btn.onclick = () => {
        if (confirm(`Sair da conta de ${user.nome}?`)) logout();
      };
      btn.title = "Clique para sair";
    } else {
      btn.textContent = "🔐 Entrar";
      btn.onclick = () => abrirModal("login");
      btn.title = "Entrar / Criar conta";
    }
  }

  // ── Injetar CSS do modal ───────────────────────────────────
  function injetarCSS() {
    if (document.getElementById("auth-css")) return;
    const style = document.createElement("style");
    style.id = "auth-css";
    style.textContent = `
      #auth-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 10000;
        align-items: center;
        justify-content: center;
      }
      #auth-modal.active { display: flex; }

      #auth-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(4px);
      }

      #auth-box {
        position: relative;
        background: var(--card, #1a1830);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 28px 24px;
        width: min(420px, calc(100vw - 32px));
        max-height: 90vh;
        overflow-y: auto;
        animation: authBoxIn .25s cubic-bezier(.34,1.56,.64,1);
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }

      @keyframes authBoxIn {
        from { transform: scale(.85) translateY(20px); opacity:0; }
        to   { transform: scale(1) translateY(0);     opacity:1; }
      }

      #auth-close {
        position: absolute;
        top: 12px; right: 14px;
        background: none;
        border: none;
        color: var(--muted, #a7a9be);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: color .2s;
      }
      #auth-close:hover { color: var(--text, #fff); }

      .auth-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
      }

      .auth-tab {
        flex: 1;
        padding: 10px;
        border-radius: 10px;
        border: 2px solid rgba(255,255,255,0.08);
        background: transparent;
        color: var(--muted, #a7a9be);
        font-family: 'Nunito', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all .2s;
      }
      .auth-tab.active {
        border-color: var(--accent, #ff6b35);
        color: var(--accent, #ff6b35);
        background: rgba(255,107,53,0.1);
      }

      .auth-subtitle {
        font-size: 0.85rem;
        color: var(--muted, #a7a9be);
        margin-bottom: 18px;
        text-align: center;
      }

      .auth-field {
        margin-bottom: 14px;
      }

      .auth-field input[type="email"],
      .auth-field input[type="password"],
      .auth-field input[type="text"] {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        color: var(--text, #fff);
        font-family: 'Nunito', sans-serif;
        font-size: 1rem;
        padding: 12px 14px;
        outline: none;
        transition: border-color .2s;
      }
      .auth-field input:focus { border-color: var(--accent, #ff6b35); }

      .auth-error {
        color: var(--red, #ff3366);
        font-size: 0.82rem;
        margin: -8px 0 10px;
        min-height: 16px;
      }

      .auth-switch {
        text-align: center;
        font-size: 0.82rem;
        color: var(--muted, #a7a9be);
        margin-top: 14px;
      }
      .auth-switch a {
        color: var(--accent3, #00e5ff);
        text-decoration: none;
        font-weight: 700;
      }
      .auth-switch a:hover { text-decoration: underline; }

      /* Botão auth no header */
      #btn-auth-header {
        font-size: 0.8rem;
        padding: 7px 14px;
        border-radius: 20px;
        border: 1.5px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.05);
        color: var(--text, #fff);
        cursor: pointer;
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        transition: all .2s;
        white-space: nowrap;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #btn-auth-header:hover {
        border-color: var(--accent, #ff6b35);
        background: rgba(255,107,53,0.12);
        color: var(--accent, #ff6b35);
      }

      /* Barra do usuário logado no ranking */
      .auth-banner {
        background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(0,229,255,0.06));
        border: 1px solid rgba(255,107,53,0.25);
        border-radius: 12px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
        font-size: 0.85rem;
      }
      .auth-banner .banner-info { flex: 1; color: var(--muted, #a7a9be); }
      .auth-banner .banner-info strong { color: var(--text, #fff); }
      .auth-banner button {
        font-size: 0.75rem;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1.5px solid rgba(255,107,53,0.4);
        background: rgba(255,107,53,0.12);
        color: var(--accent, #ff6b35);
        cursor: pointer;
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        white-space: nowrap;
        transition: all .2s;
      }
      .auth-banner button:hover { background: rgba(255,107,53,0.25); }
    `;
    document.head.appendChild(style);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    injetarCSS();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        atualizarBotaoAuth();
        processarTokenURL();
      });
    } else {
      atualizarBotaoAuth();
      processarTokenURL();
    }
  }

  // Detecta ?confirmar=TOKEN ou ?redefinir=TOKEN na URL e abre modal automaticamente
  function processarTokenURL() {
    const params = new URLSearchParams(window.location.search);
    const tokenConf = params.get("confirmar");
    const tokenRed  = params.get("redefinir");

    if (tokenConf) {
      abrirModal("confirmar");
      const okEl = document.getElementById('auth-ok-confirmar');
      if (okEl) okEl.textContent = "Verificando token...";
      
      setTimeout(async () => {
        const input = document.getElementById("conf-token");
        if (input) {
          input.value = tokenConf;
          await confirmarConta();
        }
      }, 800);
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (tokenRed) {
      abrirModal("recuperar");
      setTimeout(() => {
        mostrarAba("redefinir");
        const input = document.getElementById("red-token");
        if (input) input.value = tokenRed;
      }, 600);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  init();

  // ── API pública ────────────────────────────────────────────

  // ── Toggle visibilidade de senha ──────────────────────────
  function toggleSenha(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁';
    }
  }


  // ── Recuperação de senha ──────────────────────────────────────────────
  async function solicitarRecuperacao() {
    const btn   = document.getElementById("btn-recuperar");
    const email = document.getElementById("rec-email")?.value?.trim();
    const errEl = document.getElementById("auth-error-recuperar");
    const okEl  = document.getElementById("auth-ok-recuperar");
    errEl.textContent = ""; okEl.textContent = "";
    if (!email) { errEl.textContent = "Preencha o e-mail."; return; }
    btn.disabled = true; btn.textContent = "Enviando...";
    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/recuperar-senha`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      okEl.textContent = data.message || "Verifique seu e-mail!";
    } catch (e) {
      errEl.textContent = "Erro ao enviar. Tente novamente.";
    } finally { btn.disabled = false; btn.textContent = "📧 Enviar link"; }
  }

  // ── Confirmar conta ────────────────────────────────────────────────────
  async function confirmarConta() {
    const btn   = document.getElementById("btn-confirmar");
    const token = document.getElementById("conf-token")?.value?.trim();
    const errEl = document.getElementById("auth-error-confirmar");
    const okEl  = document.getElementById("auth-ok-confirmar");
    errEl.textContent = "";
    if (!token) { errEl.textContent = "Cole o token do e-mail."; return; }
    btn.disabled = true; btn.textContent = "Verificando...";
    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/confirmar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      salvarToken(data.token, data.usuario);
      atualizarBotaoAuth();
      fecharModal();
      if (typeof toast === "function") toast("✅ Conta confirmada! Bem-vindo!", "ok");
      if (typeof jogador !== "undefined") {
        jogador.nome   = data.usuario.nome;
        jogador.avatar = data.usuario.avatar || "🦁";
      }
      const inpNome = document.getElementById("inp-nome");
      if (inpNome) inpNome.value = data.usuario.nome;
      const avBtns = document.querySelectorAll(".av-btn");
      avBtns.forEach(b => {
        b.classList.toggle("selected", b.textContent === (data.usuario.avatar || "🦁"));
      });
      if (typeof irParaMenu === "function") setTimeout(() => irParaMenu(), 300);
    } catch (e) {
      errEl.textContent = e.message || "Token inválido.";
    } finally { btn.disabled = false; btn.textContent = "✅ Confirmar conta"; }
  }

  // ── Reenviar confirmação ───────────────────────────────────────────────
  async function reenviarConfirmacao() {
    const okEl  = document.getElementById("auth-ok-confirmar");
    const errEl = document.getElementById("auth-error-confirmar");
    const email = prompt("Digite seu e-mail para reenviar a confirmação:");
    if (!email) return;
    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/reenviar-confirmacao`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (okEl) okEl.textContent = data.message || "E-mail reenviado!";
    } catch (e) { if (errEl) errEl.textContent = "Erro ao reenviar."; }
  }

  // ── Redefinir senha (chegou do link do email) ────────────────────────
  async function redefinirSenha() {
    const btn    = document.getElementById("btn-redefinir");
    const token  = document.getElementById("red-token")?.value?.trim();
    const nova   = document.getElementById("red-nova")?.value || "";
    const conf   = document.getElementById("red-nova-confirm")?.value || "";
    const errEl  = document.getElementById("auth-error-redefinir");
    const okEl   = document.getElementById("auth-ok-redefinir");

    errEl.textContent = ""; okEl.textContent = "";
    if (!nova || nova.length < 6) { errEl.textContent = "Senha deve ter no mínimo 6 caracteres."; return; }
    if (nova !== conf) { errEl.textContent = "As senhas não coincidem."; return; }

    btn.disabled = true; btn.textContent = "Salvando...";
    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/redefinir-senha`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha: nova })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      okEl.textContent = "Senha redefinida! Faça login.";
      setTimeout(() => mostrarAba("login"), 2000);
    } catch (e) {
      errEl.textContent = e.message || "Token inválido. Solicite outro link.";
    } finally { btn.disabled = false; btn.textContent = "🔑 Salvar nova senha"; }
  }

return { getToken, getUser, estaLogado, logout, abrirModal, fecharModal, mostrarAba, fazerLogin, fazerRegistro, atualizarBotaoAuth, toggleSenha, solicitarRecuperacao, confirmarConta, reenviarConfirmacao, redefinirSenha };
})();