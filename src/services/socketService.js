import { io } from 'socket.io-client';
import { useGlobalStore } from '../store/globalStore';

const SOCKET_URL = 'https://internal-product-backend.onrender.com';

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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      // Socket connection error occurred
    });

    // Listen for inbox updates - play notification and update state
    this.socket.on('inbox', (data) => {
      this.playNotificationSound();
      this.showNotificationAlert('New Inbox', `New message received`);
      
      const store = useGlobalStore.getState();
      if (data && data._id) {
        // Check if inbox exists in state - update or add
        const existingInbox = store.inboxes.find(i => i._id === data._id);
        
        // Prepare inbox data - merge with defaults for missing fields
        let inboxData = {
          ...data,
          isUnread: data.isUnread !== undefined ? data.isUnread : true,
          status: data.status || 'unread',
          inboxDateTime: data.inboxDateTime || data.updatedAt || new Date().toISOString(),
        };
        
        // If dummyOwner is just an ID (string), try to get it from existing inbox
        if (typeof inboxData.dummyOwner === 'string' && existingInbox?.dummyOwner && typeof existingInbox.dummyOwner === 'object') {
          inboxData.dummyOwner = existingInbox.dummyOwner;
        }
        
        // If owner is just an ID (string), try to get it from existing inbox
        if (typeof inboxData.owner === 'string' && existingInbox?.owner && typeof existingInbox.owner === 'object') {
          inboxData.owner = existingInbox.owner;
        }
        
        if (existingInbox) {
          // Update existing inbox with all received data
          store.handleInboxUpdated(inboxData);
        } else {
          // Add new inbox with all received data
          store.handleInboxCreated(inboxData);
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
