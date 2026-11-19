/**
 * WebSocket service placeholder for live telemetry streaming.
 * Configured for real-time WebSocket connection in Week 3.
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(url = 'http://localhost:5000') {
    console.log(`[SocketService] WebSocket connection configured for: ${url}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, callbacks);
  }
}

export const socketService = new SocketService();
export default socketService;
