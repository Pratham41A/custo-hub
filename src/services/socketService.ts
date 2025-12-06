import { io, Socket } from 'socket.io-client';
import { useGlobalStore } from '@/store/globalStore';
import { Inbox, Message } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(url: string = 'http://localhost:3001') {
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
  simulateInboxUpdated(inbox: Inbox) {
    const store = useGlobalStore.getState();
    store.handleInboxUpdated(inbox);
  }

  simulateInboxCreated(inbox: Inbox) {
    const store = useGlobalStore.getState();
    store.handleInboxCreated(inbox);
  }

  simulateMessageCreated(message: Message) {
    const store = useGlobalStore.getState();
    store.handleMessageCreated(message);
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
