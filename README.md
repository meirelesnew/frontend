# Tabuada Turbo — Frontend

Frontend do jogo [tabuadaturbo.com.br](https://tabuadaturbo.com.br) — HTML + CSS + JS + Firebase Auth.

## Stack

| Tecnologia | Uso |
|---|---|
| HTML / CSS / JS vanilla | Interface |
| Firebase Auth SDK (compat) | Login email e Google |
| Socket.io client | Modo Batalha |
| GitHub Pages | Hospedagem |
| PWA | Instalavel |

## Estrutura

```
frontend/
├── index.html        # Jogo principal
├── admin.html        # Painel admin
├── manifest.json     # PWA
├── sw.js             # Service Worker
├── css/style.css
└── js/
    ├── config.js       # API_URL + Firebase config
    ├── api.js          # Comunicacao com backend
    ├── auth.js         # Firebase Auth
    ├── socket.js       # Modo Batalha
    ├── game.js         # Logica do jogo
    ├── ranking.js      # Tela de ranking
    └── app.js          # Inicializacao
```

## Funcionalidades

- Modo Solo (Nivel 1 e 2)
- Modo Batalha multiplayer em tempo real
- Ranking global
- Login com email/senha e Google (Firebase Auth)
- PWA instalavel
