// ══════════════════════════════════════════
//  SOCKET.JS — Carregamento lazy do Socket.io
//  Só carrega quando batalha for iniciada
// ══════════════════════════════════════════
let _socket = null;
let _socketReady = false;

function loadSocketIO(callback) {
  if (_socketReady && _socket) { callback(_socket); return; }
  if (document.querySelector('script[src*="socket.io"]')) {
    // já está sendo carregado — aguardar
    const wait = setInterval(() => {
      if (typeof io !== 'undefined') {
        clearInterval(wait);
        _socket = io(CONFIG.API_URL.replace('/api', ''), { transports: ['websocket', 'polling'] });
        _socketReady = true;
        callback(_socket);
      }
    }, 100);
    return;
  }
  // Injetar script dinamicamente
  const s = document.createElement('script');
  s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
  s.onload = () => {
    _socket = io(CONFIG.API_URL.replace('/api', ''), { transports: ['websocket', 'polling'] });
    _socketReady = true;
    callback(_socket);
  };
  document.head.appendChild(s);
}

// Expõe globalmente
window.loadSocketIO = loadSocketIO;
window.getSocket = () => _socket;
