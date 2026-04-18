# Tabuada Turbo — Frontend 🏎️

Jogo educativo de tabuada com ranking global, login Google e modo batalha.

## URL
- **Produção:** `https://meirelesnew.github.io/frontend/`

## Funcionalidades
- ✅ Login com email/senha
- ✅ Login com Google (OAuth)
- ✅ Registro com confirmação de senha
- ✅ Ver/ocultar senha
- ✅ Ranking global (MongoDB)
- ✅ Modo visitante (sem conta)
- ✅ Nível 1 — Clássico
- ✅ Nível 2 — Embaralhado
- ✅ Modo Batalha multiplayer
- ✅ Timer e sistema de celebração
- ✅ Música via Web Audio API

## Estrutura
```
index.html        — SPA com 10 telas
css/style.css     — Design completo (807 linhas)
js/
  config.js       — URL da API centralizada
  api.js          — Camada HTTP (fetch + JWT)
  auth.js         — Login, registro, Google OAuth, modal
  game.js         — Lógica do jogo, batalha, efeitos
  ranking.js      — Ranking local + global
  app.js          — Música, countdown, feedback, toast
```

## Deploy
GitHub Pages — branch `main`, raiz `/`.
Push para `main` → atualiza em ~1 min.
