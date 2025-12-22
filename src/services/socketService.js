import { io } from 'socket.io-client';
import { useGlobalStore } from '@/store/globalStore';

const SOCKET_URL = 'https://sadmin-api.onference.in';

class SocketService {
  socket = null;
  isConnected = false;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to socket server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
      }
    });

    // Listen for inbox updates
    this.socket.on('inbox:updated', (inbox) => {
      console.log('Inbox updated event:', inbox);
      const store = useGlobalStore.getState();
      store.handleInboxUpdated(inbox);
    });

    // Listen for new inboxes
    this.socket.on('inbox:created', (inbox) => {
      console.log('New inbox created:', inbox);
      const store = useGlobalStore.getState();
      store.handleInboxCreated(inbox);
    });

    // Listen for new messages
    this.socket.on('message:created', (message) => {
      console.log('New message received:', message);
      const store = useGlobalStore.getState();
      store.handleMessageCreated(message);
    });

    // Listen for WhatsApp webhook events
    this.socket.on('whatsapp:message', (data) => {
      console.log('WhatsApp message event:', data);
      const store = useGlobalStore.getState();
      if (data.message) {
        store.handleMessageCreated(data.message);
      }
      if (data.inbox) {
        store.handleInboxUpdated(data.inbox);
      }
    });

    // Listen for Outlook webhook events
    this.socket.on('outlook:message', (data) => {
      console.log('Outlook message event:', data);
      const store = useGlobalStore.getState();
      if (data.message) {
        store.handleMessageCreated(data.message);
      }
      if (data.inbox) {
        store.handleInboxUpdated(data.inbox);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    console.log('Socket disconnected manually');
  }

  isSocketConnected() {
    return this.socket?.connected || false;
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit, socket not connected');
    }
  }
}

export const socketService = new SocketService();
