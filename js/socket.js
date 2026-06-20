let socket = null;

export function connectSocket(playerId, playerName) {
  if (socket?.connected) return socket;

  socket = io({
    auth: { playerId, playerName },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    socket.emit('player:join', { playerId, playerName });
  });

  socket.on('connect_error', (err) => {});

  socket.on('disconnect', (reason) => {});

  return socket;
}

export function emitSocket(event, data) {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

export function onSocket(event, handler) {
  if (socket) {
    socket.on(event, handler);
  }
}

export function offSocket(event, handler) {
  if (socket) {
    socket.off(event, handler);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
