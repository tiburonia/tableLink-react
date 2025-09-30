let socket = null;

export function initSocket(url) {
  if (socket) {
    console.warn('Socket already initialized');
    return socket;
  }
  
  if (!window.io) {
    throw new Error('Socket.IO is not loaded');
  }
  
  socket = window.io(url);
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  return socket;
}

export function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
}

export function emit(event, data) {
  const sock = getSocket();
  sock.emit(event, data);
}

export function on(event, callback) {
  const sock = getSocket();
  sock.on(event, callback);
}

export function off(event, callback) {
  const sock = getSocket();
  if (callback) {
    sock.off(event, callback);
  } else {
    sock.off(event);
  }
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
