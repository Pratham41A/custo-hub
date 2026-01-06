import { io } from 'socket.io-client';
import { useGlobalStore } from '../store/globalStore';

const SOCKET_URL = 'https://sadmin-api.onference.in';

class SocketService {
  socket = null;
  isConnected = false;

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to socket server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Listen for incoming messages
    this.socket.on('message', (data) => {
      console.log('Socket [message] received:', data);
      
      const store = useGlobalStore.getState();
      if (data && data._id) {
        store.handleMessageCreated({
          _id: data._id,
          inboxId: data.inboxId,
          from: data.from,
          to: data.to,
          subject: data.subject,
          body: data.body,
          source: data.source,
          type: data.type,
          template: data.template,
          inReplyTo: data.inReplyTo,
          messageId: data.messageId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        console.log('Message added to state');
      }
    });

    // Listen for inbox updates
    this.socket.on('inbox', (data) => {
      console.log('Socket [inbox] received:', data);
      this.playNotificationSound();
      
      const store = useGlobalStore.getState();
      if (data && data._id) {
        // Check if inbox exists in state - update or add
        const existingInbox = store.inboxes.find(i => i._id === data._id);
        
        if (existingInbox) {
          // Update existing inbox
          store.handleInboxUpdated({
            _id: data._id,
            owner: data.owner,
            createdAt: data.createdAt,
            preview: data.preview,
            status: data.status,
            updatedAt: data.updatedAt,
          });
          console.log('Inbox updated in state');
        } else {
          // Add new inbox
          store.handleInboxCreated({
            _id: data._id,
            owner: data.owner,
            createdAt: data.createdAt,
            preview: data.preview,
            status: data.status,
            updatedAt: data.updatedAt,
          });
          console.log('New inbox added to state');
        }
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
