import { io } from 'socket.io-client';
import { useGlobalStore } from '@/store/globalStore';

class SocketService {
  socket = null;
  isConnected = false;

  connect(url = 'http://localhost:3001') {
    // For demo purposes, we'll simulate socket events
    console.log('Socket service initialized (mock mode)');
    this.isConnected = true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  // Simulate incoming events for demo
  simulateInboxUpdated(inbox) {
    const store = useGlobalStore.getState();
    store.handleInboxUpdated(inbox);
  }

  simulateInboxCreated(inbox) {
    const store = useGlobalStore.getState();
    store.handleInboxCreated(inbox);
  }

  simulateMessageCreated(message) {
    const store = useGlobalStore.getState();
    store.handleMessageCreated(message);
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
