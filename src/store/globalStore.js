import { create } from 'zustand';
import { apiService } from '@/services/apiService';

export const useGlobalStore = create((set, get) => ({
  // Data
  users: [],
  subscriptions: [],
  payments: [],
  inboxes: [],
  messages: [],
  views: [],
  notes: [],
  queryTypes: [],
  dashboardData: null,
  
  // Loading states
  loading: {
    inboxes: false,
    messages: false,
    dashboard: false,
    userDetails: false,
  },
  
  // UI State
  selectedInbox: null,
  selectedUser: null,
  activeFilter: 'all',
  dateRange: { start: null, end: null },
  pagination: { skip: 0, limit: 20 },
  
  // Loading setters
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  // Setters
  setUsers: (users) => set({ users }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setPayments: (payments) => set({ payments }),
  setInboxes: (inboxes) => set({ inboxes }),
  setMessages: (messages) => set({ messages }),
  setViews: (views) => set({ views }),
  setNotes: (notes) => set({ notes }),
  setQueryTypes: (queryTypes) => set({ queryTypes }),
  setDashboardData: (dashboardData) => set({ dashboardData }),
  
  setSelectedInbox: (inbox) => set({ selectedInbox: inbox }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setDateRange: (range) => set({ dateRange: range }),
  setPagination: (pagination) => set({ pagination }),
  
  // API Actions
  fetchDashboard: async () => {
    const { setLoading, setDashboardData } = get();
    setLoading('dashboard', true);
    try {
      const data = await apiService.getDashboards();
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      throw error;
    } finally {
      setLoading('dashboard', false);
    }
  },

  fetchInboxes: async (options = {}) => {
    const { setLoading, setInboxes, activeFilter, dateRange, pagination } = get();
    setLoading('inboxes', true);
    try {
      const params = {
        status: options.status ?? (activeFilter === 'all' ? '' : activeFilter),
        limit: options.limit ?? pagination.limit,
        skip: options.skip ?? pagination.skip,
        startDate: options.startDate ?? dateRange.start ?? '',
        endDate: options.endDate ?? dateRange.end ?? '',
      };
      const data = await apiService.getInboxes(params);
      const inboxList = data.inboxes || data.data || data || [];
      setInboxes(inboxList);
      return inboxList;
    } catch (error) {
      console.error('Failed to fetch inboxes:', error);
      throw error;
    } finally {
      setLoading('inboxes', false);
    }
  },

  fetchMessages: async (inboxId) => {
    const { setLoading, setMessages } = get();
    setLoading('messages', true);
    try {
      const data = await apiService.getMessages(inboxId);
      const messageList = data.messages || data.data || data || [];
      setMessages(messageList);
      return messageList;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    } finally {
      setLoading('messages', false);
    }
  },

  // Inbox Operations
  updateInboxStatus: async (inboxId, status, queryTypes = '') => {
    try {
      await apiService.updateInbox({ 
        inboxId, 
        type: 'status', 
        status,
        queryTypes,
      });
      set((state) => ({
        inboxes: state.inboxes.map((inbox) =>
          inbox.id === inboxId || inbox._id === inboxId 
            ? { ...inbox, status, updated_at: new Date().toISOString() } 
            : inbox
        ),
        selectedInbox: (state.selectedInbox?.id === inboxId || state.selectedInbox?._id === inboxId)
          ? { ...state.selectedInbox, status, updated_at: new Date().toISOString() }
          : state.selectedInbox,
      }));
      return true;
    } catch (error) {
      console.error('Failed to update inbox status:', error);
      throw error;
    }
  },

  // User data fetching
  fetchUserSubscriptions: async (userid, limit = 10) => {
    try {
      const data = await apiService.getSubscriptions(userid, limit);
      const subs = data.subscriptions || data.data || data || [];
      set({ subscriptions: subs });
      return subs;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return [];
    }
  },

  fetchUserPayments: async (userid, limit = 10) => {
    try {
      const data = await apiService.getPayments(userid, limit);
      const payments = data.payments || data.data || data || [];
      set({ payments });
      return payments;
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  },

  fetchUserViews: async (userid, limit = 10) => {
    try {
      const data = await apiService.getViews(userid, limit);
      const views = data.views || data.data || data || [];
      set({ views });
      return views;
    } catch (error) {
      console.error('Failed to fetch views:', error);
      return [];
    }
  },

  fetchUserActivities: async (userid, limit = 10) => {
    try {
      const data = await apiService.getActivities(userid, limit);
      const notes = data.activities || data.data || data || [];
      set({ notes });
      return notes;
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  },

  // Message Operations
  sendWhatsappTemplate: async (mobile, template) => {
    try {
      const result = await apiService.sendWhatsappTemplate(mobile, template);
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      throw error;
    }
  },

  sendWhatsappMessage: async (mobile, body) => {
    try {
      const result = await apiService.sendWhatsappMessage(mobile, body);
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  },

  sendEmailReply: async (replyMessageId, body, email) => {
    try {
      const result = await apiService.sendEmailReply(replyMessageId, body, email);
      return result;
    } catch (error) {
      console.error('Failed to send email reply:', error);
      throw error;
    }
  },

  sendNewEmail: async (subject, body, email) => {
    try {
      const result = await apiService.sendNewEmail(subject, body, email);
      return result;
    } catch (error) {
      console.error('Failed to send new email:', error);
      throw error;
    }
  },

  // Note Operations
  createNote: async (owner, body, dueDate) => {
    try {
      const result = await apiService.createActivity(owner, body, dueDate);
      const newNote = result.activity || result;
      set((state) => ({
        notes: [...state.notes, newNote],
      }));
      return result;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  },
  
  // Legacy support for local operations
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  addNote: (note) => set((state) => ({
    notes: [...state.notes, note],
  })),

  addInbox: (inbox) => set((state) => ({
    inboxes: [inbox, ...state.inboxes],
  })),
  
  // Dashboard Stats (calculated from API data or local data)
  getDashboardStats: () => {
    const { inboxes, dashboardData } = get();
    
    // If we have API dashboard data, use it
    if (dashboardData) {
      return dashboardData;
    }
    
    // Fallback to calculating from inboxes
    const stats = {
      read: inboxes.filter((i) => i.status === 'read').length,
      unread: inboxes.filter((i) => i.status === 'unread').length,
      resolved: inboxes.filter((i) => i.status === 'resolved').length,
      pending: inboxes.filter((i) => i.status === 'pending').length,
      escalated: inboxes.filter((i) => i.status === 'escalated').length,
      queryTypeStats: {},
      whatsappResolved: inboxes.filter((i) => i.status === 'resolved' && i.source === 'whatsapp').length,
      emailResolved: inboxes.filter((i) => i.status === 'resolved' && i.source === 'email').length,
    };
    
    inboxes
      .filter((i) => i.status === 'resolved')
      .forEach((inbox) => {
        const queryTypes = inbox.query_types || [];
        queryTypes.forEach((qt) => {
          stats.queryTypeStats[qt] = (stats.queryTypeStats[qt] || 0) + 1;
        });
      });
    
    return stats;
  },
  
  // Socket Event Handlers
  handleInboxUpdated: (inbox) => set((state) => ({
    inboxes: state.inboxes.map((i) => 
      (i.id === inbox.id || i._id === inbox._id) ? inbox : i
    ),
    selectedInbox: (state.selectedInbox?.id === inbox.id || state.selectedInbox?._id === inbox._id) 
      ? inbox 
      : state.selectedInbox,
  })),
  
  handleInboxCreated: (inbox) => set((state) => ({
    inboxes: [inbox, ...state.inboxes],
  })),
  
  handleMessageCreated: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
}));
