import { io } from 'socket.io-client';
// For socket events we interact with the redux store directly
import { store, handleInboxUpdated, handleInboxCreated } from '../store/globalStore';

const SOCKET_URL = 'https://sadmin-api.onference.in';

class SocketService {
  socket = null;
  isConnected = false;
  audioContext = null;

  initAudioContext() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      // Audio context initialization failed
    }
  }

  playNotificationSound() {
    try {
      // Ensure AudioContext is initialized
      if (!this.audioContext) {
        this.initAudioContext();
      }
      
      if (!this.audioContext) {
        return;
      }
      
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      // Notification sound failed
    }
  }

  showNotificationAlert(title = 'New Message', message = 'You have a new message') {
    try {
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/robots.txt',
          tag: 'message-notification',
          requireInteraction: true,
        });
      }
    } catch (error) {
      // Notification alert failed
    }
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    // Initialize AudioContext on connect
    this.initAudioContext();

    this.socket = io(SOCKET_URL, {
      transports: ['websockets'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connection', () => {
      alert('Connected')
      this.isConnected = true;
    });

    this.socket.on('disconnection', (reason) => {
      alert('Disconnection')
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      // Socket connection error occurred
    });

    // Listen for inbox updates - play notification and update state
    this.socket.on('message', (data) => {
      alert('New Message Received')
      this.playNotificationSound();
      this.showNotificationAlert('New Inbox', `New message received`);
      
      const state = store.getState().global;
      if (data && data._id) {
        const existingInbox = state.inboxes.find(i => i._id === data._id);
        let inboxData = {
          ...data,
          status: data.status || 'unread',
          inboxDateTime: data.inboxDateTime || data.updatedAt || new Date().toISOString(),
        };
        if (typeof inboxData.dummyOwner === 'string' && existingInbox?.dummyOwner && typeof existingInbox.dummyOwner === 'object') {
          inboxData.dummyOwner = existingInbox.dummyOwner;
        }
        if (typeof inboxData.owner === 'string' && existingInbox?.owner && typeof existingInbox.owner === 'object') {
          inboxData.owner = existingInbox.owner;
        }
        if (existingInbox) {
          store.dispatch(handleInboxUpdated(inboxData));
        } else {
          store.dispatch(handleInboxCreated(inboxData));
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
