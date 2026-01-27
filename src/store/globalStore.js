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
      // Extract array from various response formats
      let inboxList = [];
      if (Array.isArray(data)) {
        inboxList = data;
      } else if (data?.inboxes && Array.isArray(data.inboxes)) {
        inboxList = data.inboxes;
      } else if (data?.data && Array.isArray(data.data)) {
        inboxList = data.data;
      }
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
      setMessages([]); // Clear messages on error
      throw error;
    } finally {
      setLoading('messages', false);
    }
  },

  // Inbox Operations
  updateInboxStatus: async (inboxId, status, queryType = '') => {
    try {
      // Call API and get the updated inbox response
      const response = await apiService.updateInbox({ 
        inboxId, 
        status,
        queryType,
      });
      
      // Extract updated inbox from API response
      const updatedInbox = response || {};
      
      set((state) => ({
        inboxes: state.inboxes.map((inbox) =>
          inbox._id === inboxId 
            ? { ...inbox, ...updatedInbox } // Use all fields from API response
            : inbox
        ),
        selectedInbox: state.selectedInbox?._id === inboxId
          ? { ...state.selectedInbox, ...updatedInbox } // Use all fields from API response
          : state.selectedInbox,
      }));
      return updatedInbox;
    } catch (error) {
      throw error;
    }
  },

  // User data fetching - matches API response format
  fetchUserSubscriptions: async (userId) => {
    try {
      const response = await apiService.getSubscriptions(userId);
      const subs = response.data || response || [];
      set({ subscriptions: subs });
      return { data: subs };
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return { data: [] };
    }
  },

  fetchUserPayments: async (userId) => {
    try {
      const response = await apiService.getPayments(userId);
      const payments = response.data || response || [];
      set({ payments });
      return { data: payments };
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return { data: [] };
    }
  },

  fetchUserViews: async (userId) => {
    try {
      const response = await apiService.getViews(userId);
      const viewsData = response.data || response || [];
      // Ensure views is always an array
      const views = Array.isArray(viewsData) ? viewsData : [];
      set({ views });
      return { data: views };
    } catch (error) {
      console.error('Failed to fetch views:', error);
      return { data: [] };
    }
  },

  fetchUserActivities: async (inboxId) => {
    try {
      const response = await apiService.getActivities(inboxId);
      // API returns { count, activities } or activities array directly
      let notesData = response.activities || response.data || response || [];
      // Ensure notes is always an array
      const notes = Array.isArray(notesData) ? notesData : [];
      set({ notes });
      return { data: notes };
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return { data: [] };
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

  sendEmailReply: async (replyMessageId, htmlBody, email) => {
    try {
      return await apiService.sendEmailReply(replyMessageId, htmlBody, email);
    } catch (error) {
      console.error('Failed to send email reply:', error);
      throw error;
    }
  },

  sendNewEmail: async (email, subject, htmlBody) => {
    try {
      return await apiService.sendNewEmail(email, subject, htmlBody);
    } catch (error) {
      console.error('Failed to send new email:', error);
      throw error;
    }
  },

  // Note Operations
  createNote: async (inboxId, body, dueDate) => {
    try {
      const result = await apiService.createActivity(inboxId, body, dueDate);
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
      let queryTypes = [];
      // Handle response format: { count, queryTypes: [...] }
      if (response.queryTypes && Array.isArray(response.queryTypes)) {
        queryTypes = response.queryTypes;
      } else if (Array.isArray(response)) {
        queryTypes = response;
      } else if (response.data && Array.isArray(response.data)) {
        queryTypes = response.data;
      }
      set({ queryTypes });
      return queryTypes;
    } catch (error) {
      console.error('Failed to fetch query types:', error);
      return [];
    }
  },

  // Create Query Type
  createQueryType: async (name) => {
    try {
      const response = await apiService.createQueryType(name);
      const newQueryType = response.data || response;
      set((state) => ({
        queryTypes: [...state.queryTypes, newQueryType],
      }));
      return newQueryType;
    } catch (error) {
      console.error('Failed to create query type:', error);
      throw error;
    }
  },

  // Fetch WhatsApp Templates
  fetchWhatsappTemplates: async () => {
    try {
      const response = await apiService.fetchWhatsappTemplates();
      const templates = response.whatsappTemplates || response.templates || response || [];
      return templates;
    } catch (error) {
      console.error('Failed to fetch whatsapp templates:', error);
      return [];
    }
  },

  // Send WhatsApp Template with parameters
  sendWhatsappTemplateWithParams: async (mobile, template) => {
    try {
      return await apiService.sendWhatsappTemplateWithParams(mobile, template);
    } catch (error) {
      console.error('Failed to send whatsapp template:', error);
      throw error;
    }
  },
  
  // Dashboard Stats - matches API response format
  getDashboardStats: () => {
    const { dashboardData } = get();
    
    if (dashboardData) {
      const statusKeys = ['unread', 'read', 'started', 'resolved'];
      const channelKeys = ['whatsapp', 'email', 'web'];
      
      // Extract channels
      const channels = channelKeys
        .filter(key => dashboardData[key] !== undefined)
        .map(key => ({ _id: key, count: dashboardData[key] || 0 }));
      
      // Extract query types (everything else that is not status or channel)
      const queryTypes = Object.keys(dashboardData)
        .filter(key => !statusKeys.includes(key) && !channelKeys.includes(key))
        .map(key => ({ _id: key, count: dashboardData[key] || 0 }));
      
      return {
        unread: dashboardData.unread || 0,
        read: dashboardData.read || 0,
        started: dashboardData.started || 0,
        resolved: dashboardData.resolved || 0,
        channels,
        queryTypes,
      };
    }
    
    return {
      unread: 0,
      read: 0,
      started: 0,
      resolved: 0,
      channels: [],
      queryTypes: [],
    };
  },
  
  // Socket Event Handlers
  handleInboxUpdated: (inbox) => set((state) => {
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
    const exists = state.inboxes.some(i => i._id === inbox._id);
    if (exists) return state;
    // Ensure new inboxes have isUnread set to true
    const newInbox = {
      ...inbox,
      isUnread: inbox.isUnread !== undefined ? inbox.isUnread : true,
      status: inbox.status || 'unread',
    };
    return {
      inboxes: [newInbox, ...state.inboxes],
    };
  }),
  
  handleMessageCreated: (message) => set((state) => {
    const exists = state.messages.some(m => m._id === message._id);
    if (exists) return state;
    return {
      messages: [...state.messages, message],
    };
  }),
}));
