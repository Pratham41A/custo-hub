import { create } from 'zustand';
import { apiService } from '../services/apiService';

export const useGlobalStore = create((set, get) => ({
  // Data
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
  activeFilter: 'all',
  dateRange: { start: null, end: null },
  pagination: { skip: 0, limit: 20 },
  
  // Loading setters
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  // Setters
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setPayments: (payments) => set({ payments }),
  setInboxes: (inboxes) => set({ inboxes }),
  setMessages: (messages) => set({ messages }),
  setViews: (views) => set({ views }),
  setNotes: (notes) => set({ notes }),
  setQueryTypes: (queryTypes) => set({ queryTypes }),
  setDashboardData: (dashboardData) => set({ dashboardData }),
  
  setSelectedInbox: (inbox) => set({ selectedInbox: inbox }),
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
          inbox._id === inboxId 
            ? { ...inbox, status, updatedAt: new Date().toISOString() } 
            : inbox
        ),
        selectedInbox: state.selectedInbox?._id === inboxId
          ? { ...state.selectedInbox, status, updatedAt: new Date().toISOString() }
          : state.selectedInbox,
      }));
      return true;
    } catch (error) {
      console.error('Failed to update inbox status:', error);
      throw error;
    }
  },

  // User data fetching - matches API response format
  fetchUserSubscriptions: async (userid, limit = 10) => {
    try {
      const response = await apiService.getSubscriptions(userid, limit);
      const subs = response.data || [];
      set({ subscriptions: subs });
      return { data: subs, pagination: response.pagination };
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return { data: [], pagination: null };
    }
  },

  fetchUserPayments: async (userid, limit = 10) => {
    try {
      const response = await apiService.getPayments(userid, limit);
      const payments = response.data || [];
      set({ payments });
      return { data: payments, pagination: response.pagination };
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return { data: [], pagination: null };
    }
  },

  fetchUserViews: async (userid, limit = 10) => {
    try {
      const response = await apiService.getViews(userid, limit);
      const views = response.data || [];
      set({ views });
      return { data: views, pagination: response.pagination };
    } catch (error) {
      console.error('Failed to fetch views:', error);
      return { data: [], pagination: null };
    }
  },

  fetchUserActivities: async (userid, limit = 10) => {
    try {
      const response = await apiService.getActivities(userid, limit);
      const notes = response.data || [];
      set({ notes });
      return { data: notes, pagination: response.pagination };
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return { data: [], pagination: null };
    }
  },

  // Message Operations
  sendWhatsappTemplate: async (mobile, template) => {
    try {
      return await apiService.sendWhatsappTemplate(mobile, template);
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      throw error;
    }
  },

  sendWhatsappMessage: async (mobile, body) => {
    try {
      return await apiService.sendWhatsappMessage(mobile, body);
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  },

  sendEmailReply: async (replyMessageId, body, email) => {
    try {
      return await apiService.sendEmailReply(replyMessageId, body, email);
    } catch (error) {
      console.error('Failed to send email reply:', error);
      throw error;
    }
  },

  sendNewEmail: async (subject, body, email) => {
    try {
      return await apiService.sendNewEmail(subject, body, email);
    } catch (error) {
      console.error('Failed to send new email:', error);
      throw error;
    }
  },

  // Note Operations - matches API format
  createNote: async (owner, body, dueDate) => {
    try {
      const result = await apiService.createActivity(owner, body, dueDate);
      set((state) => ({
        notes: [...state.notes, result],
      }));
      return result;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  },

  // Fetch Query Types
  fetchQueryTypes: async () => {
    try {
      const response = await apiService.fetchQueryTypes();
      const queryTypes = response.data || [];
      set({ queryTypes });
      return queryTypes;
    } catch (error) {
      console.error('Failed to fetch query types:', error);
      return [];
    }
  },
  
  // Dashboard Stats - matches API response format
  getDashboardStats: () => {
    const { dashboardData } = get();
    
    if (dashboardData) {
      const { statusSummary = {}, categoryResolvedSummary = [], channelResolvedSummary = [] } = dashboardData;
      return {
        unread: statusSummary.unread || 0,
        read: statusSummary.read || 0,
        started: statusSummary.started || 0,
        resolved: statusSummary.resolved || 0,
        ended: statusSummary.ended || 0,
        pending: statusSummary.pending || 0,
        categoryResolvedSummary,
        channelResolvedSummary,
      };
    }
    
    return {
      unread: 0,
      read: 0,
      started: 0,
      resolved: 0,
      ended: 0,
      pending: 0,
      categoryResolvedSummary: [],
      channelResolvedSummary: [],
    };
  },
  
  // Socket Event Handlers
  handleInboxUpdated: (inbox) => set((state) => {
    console.log('Store: Updating inbox', inbox._id);
    return {
      inboxes: state.inboxes.map((i) => 
        i._id === inbox._id 
          ? { ...i, ...inbox }
          : i
      ),
      selectedInbox: state.selectedInbox?._id === inbox._id 
        ? { ...state.selectedInbox, ...inbox }
        : state.selectedInbox,
    };
  }),
  
  handleInboxCreated: (inbox) => set((state) => {
    console.log('Store: Adding new inbox', inbox._id);
    const exists = state.inboxes.some(i => i._id === inbox._id);
    if (exists) return state;
    return {
      inboxes: [inbox, ...state.inboxes],
    };
  }),
  
  handleMessageCreated: (message) => set((state) => {
    console.log('Store: Adding new message', message._id);
    const exists = state.messages.some(m => m._id === message._id);
    if (exists) return state;
    return {
      messages: [...state.messages, message],
    };
  }),
}));
