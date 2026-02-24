import { create } from 'zustand';
import { apiService } from '../services/apiService';

export const useGlobalStore = create((set, get) => ({
  // Data
  subscriptions: [],
  payments: [],
  inboxes: [],
    allInboxes: [],
  whatsappTemplates: [],
  // Map of inboxId -> resolutions array
  resolutionsByInbox: {},
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
  // Global toast notification
  toast: { text: '', type: '' },
  showToast: (text, type = 'info', duration = 3000) => {
    set({ toast: { text, type } });
    try {
      setTimeout(() => set({ toast: { text: '', type: '' } }), duration);
    } catch (e) { /* ignore */ }
  },
  
  // Loading setters
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  // Setters
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setPayments: (payments) => set({ payments }),
  setInboxes: (inboxes) => set({ inboxes }),
    setAllInboxes: (allInboxes) => set({ allInboxes }),
  setMessages: (messages) => set({ messages }),
  setViews: (views) => set({ views }),
  setNotes: (notes) => set({ notes }),
  setQueryTypes: (queryTypes) => set({ queryTypes }),
  setWhatsappTemplates: (templates) => set({ whatsappTemplates: templates }),
  setResolutionsForInbox: (inboxId, resolutions) => set((state) => ({
    resolutionsByInbox: { ...state.resolutionsByInbox, [inboxId]: resolutions }
  })),
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
      const { setLoading, setInboxes, setAllInboxes, activeFilter, dateRange, pagination, allInboxes } = get();
      setLoading('inboxes', true);
      try {
        const params = {
          status: options.status ?? (activeFilter === 'all' ? '' : activeFilter),
          limit: options.limit ?? pagination.limit,
          skip: options.skip ?? pagination.skip,
          startDate: options.startDate ?? dateRange.start ?? '',
          endDate: options.endDate ?? dateRange.end ?? '',
        };

        // If status filter is provided and we already have cached `allInboxes`,
        // filter locally to avoid extra API calls (unless forceFetch is true).
        const wantStatus = params.status;
        const force = !!options.forceFetch;
        if (wantStatus && !force && Array.isArray(allInboxes) && allInboxes.length > 0) {
          const filtered = allInboxes.filter(i => i.status === wantStatus);
          setInboxes(filtered);
          return filtered;
        }

        // If no specific status requested (all), and we have cache and not forcing, use cache
        if (!wantStatus && !force && Array.isArray(allInboxes) && allInboxes.length > 0) {
          setInboxes(allInboxes);
          return allInboxes;
        }

        // Otherwise fetch from API
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

        // Cache the full list when requesting all
        if (!wantStatus) {
          setAllInboxes(inboxList);
        }
        setInboxes(inboxList);
          // Notify success quietly
          try { get().showToast && get().showToast('Inboxes loaded', 'success', 1500); } catch(e){}
        return inboxList;
      } catch (error) {
        console.error('Failed to fetch inboxes:', error);
          try { get().showToast && get().showToast('Failed to fetch inboxes', 'error'); } catch(e){}
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
      // small success hint
      try { get().showToast && get().showToast('Messages loaded', 'success', 1200); } catch(e){}
      return messageList;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]); // Clear messages on error
      try { get().showToast && get().showToast('Failed to fetch messages', 'error'); } catch(e){}
      throw error;
    } finally {
      setLoading('messages', false);
    }
  },

  // Inbox Operations
  updateInboxStatus: async (inboxId, status, queryType = '', resolvedBy = '') => {
    // Optimistic update: update local state immediately, then sync with API
    const prevState = get();
    const prevInbox = Array.isArray(prevState.inboxes)
      ? prevState.inboxes.find(i => i._id === inboxId)
      : (prevState.inboxes?.data || []).find(i => i._id === inboxId);

    // Apply optimistic change to both inboxes and allInboxes
    set((state) => ({
      inboxes: state.inboxes.map((inbox) =>
        inbox._id === inboxId ? { ...inbox, status, ...(queryType ? { queryType } : {}) } : inbox
      ),
      allInboxes: state.allInboxes.map((inbox) =>
        inbox._id === inboxId ? { ...inbox, status, ...(queryType ? { queryType } : {}) } : inbox
      ),
      selectedInbox: state.selectedInbox?._id === inboxId
        ? { ...state.selectedInbox, status, ...(queryType ? { queryType } : {}) }
        : state.selectedInbox,
    }));

    try {
      const response = await apiService.updateInbox({ inboxId, status, queryType, resolvedBy });
      const updatedInbox = response || {};
      // Merge API response (ensure any server-side fields are applied)
      set((state) => ({
        inboxes: state.inboxes.map((inbox) =>
          inbox._id === inboxId ? { ...inbox, ...updatedInbox } : inbox
        ),
        allInboxes: state.allInboxes.map((inbox) =>
          inbox._id === inboxId ? { ...inbox, ...updatedInbox } : inbox
        ),
        selectedInbox: state.selectedInbox?._id === inboxId
          ? { ...state.selectedInbox, ...updatedInbox }
          : state.selectedInbox,
      }));
      try { get().showToast && get().showToast(`Inbox marked ${status}`, 'success', 1800); } catch(e){}
      return updatedInbox;
    } catch (error) {
      // Revert optimistic update on error
      set((state) => ({
        inboxes: state.inboxes.map((inbox) =>
          inbox._id === inboxId ? { ...inbox, ...(prevInbox || {}) } : inbox
        ),
        selectedInbox: state.selectedInbox?._id === inboxId
          ? { ...state.selectedInbox, ...(prevInbox || {}) }
          : state.selectedInbox,
      }));
      try { get().showToast && get().showToast('Failed to update inbox', 'error'); } catch(e){}
      throw error;
    }
  },

  // User data fetching - matches API response format
  fetchUserSubscriptions: async (userId) => {
    try {
      const response = await apiService.getSubscriptions(userId);
      const subs = response.subscriptions || response.data || response || [];
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
      const payments = response.payments || response.data || response || [];
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
      // API returns { count, videoTracks } structure
      const viewsData = response.videoTracks || response.views || response.data || response || [];
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

  // Resolutions - cache per-inbox to avoid repeated API calls
  fetchResolutions: async (inboxId) => {
    const { resolutionsByInbox, setResolutionsForInbox } = get();
    if (!inboxId) return [];
    // Return cached if present
    if (resolutionsByInbox && Array.isArray(resolutionsByInbox[inboxId]) && resolutionsByInbox[inboxId].length > 0) {
      return resolutionsByInbox[inboxId];
    }
    try {
      const response = await apiService.fetchResolutions(inboxId);
      // API returns { count, resolutions }
      const list = Array.isArray(response.resolutions) ? response.resolutions : (Array.isArray(response) ? response : []);
      setResolutionsForInbox(inboxId, list);
      return list;
    } catch (error) {
      console.error('Failed to fetch resolutions:', error);
      setResolutionsForInbox(inboxId, []);
      return [];
    }
  },

  // Message Operations
  sendWhatsappTemplate: async (mobile, template) => {
    try {
      const result = await apiService.sendWhatsappTemplate(mobile, template);
      // If API returned a message object, append to messages and update inbox metadata
      const msg = result?.message || result?.data || result;
      if (msg && (msg._id || msg.id)) {
        set((state) => ({ messages: [...state.messages, msg] }));
        // If inbox id present, update inboxes/selectedInbox updatedAt/status
        const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
        if (inboxId) {
          set((state) => ({
            inboxes: state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i),
            selectedInbox: state.selectedInbox?._id === inboxId ? { ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt } : state.selectedInbox,
          }));
        }
      }
      try { get().showToast && get().showToast('WhatsApp template sent', 'success'); } catch(e){}
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      try { get().showToast && get().showToast('Failed to send WhatsApp template', 'error'); } catch(e){}
      throw error;
    }
  },

  sendWhatsappMessage: async (mobile, body) => {
    try {
      const result = await apiService.sendWhatsappMessage(mobile, body);
      const msg = result?.message || result?.data || result;
      if (msg && (msg._id || msg.id)) {
        set((state) => ({ messages: [...state.messages, msg] }));
        const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
        if (inboxId) {
          set((state) => ({
            inboxes: state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i),
            selectedInbox: state.selectedInbox?._id === inboxId ? { ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt } : state.selectedInbox,
          }));
        }
      }
      try { get().showToast && get().showToast('WhatsApp sent', 'success'); } catch(e){}
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      try { get().showToast && get().showToast('Failed to send WhatsApp message', 'error'); } catch(e){}
      throw error;
    }
  },

  sendEmailReply: async (replyMessageId, htmlBody, email) => {
    try {
      const result = await apiService.sendEmailReply(replyMessageId, htmlBody, email);
      const msg = result?.message || result?.data || result;
      if (msg && (msg._id || msg.id)) {
        set((state) => ({ messages: [...state.messages, msg] }));
        const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
        if (inboxId) {
          set((state) => ({
            inboxes: state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i),
            selectedInbox: state.selectedInbox?._id === inboxId ? { ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt } : state.selectedInbox,
          }));
        }
      }
      try { get().showToast && get().showToast('Reply sent', 'success'); } catch(e){}
      return result;
    } catch (error) {
      console.error('Failed to send email reply:', error);
      try { get().showToast && get().showToast('Failed to send reply', 'error'); } catch(e){}
      throw error;
    }
  },

  sendNewEmail: async (email, subject, htmlBody) => {
    try {
      const result = await apiService.sendNewEmail(email, subject, htmlBody);
      const msg = result?.message || result?.data || result;
      if (msg && (msg._id || msg.id)) {
        set((state) => ({ messages: [...state.messages, msg] }));
      }
      try { get().showToast && get().showToast('Email sent', 'success'); } catch(e){}
      return result;
    } catch (error) {
      console.error('Failed to send new email:', error);
      try { get().showToast && get().showToast('Failed to send email', 'error'); } catch(e){}
      throw error;
    }
  },

  // Message Operations - Uses existing updateInbox endpoint with messageId
  updateMessage: async (inboxId, messageId, status, queryType = '', resolvedBy = '') => {
    try {
      const result = await apiService.updateInbox({ inboxId, messageId, status, queryType, resolvedBy });
      // If API returned updated message object, merge it; otherwise apply optimistic fields
      const updatedMsg = result?.message || result?.data || null;
      if (updatedMsg && (updatedMsg._id || updatedMsg.id)) {
        const mid = updatedMsg._id || updatedMsg.id;
        set((state) => ({
          messages: state.messages.map((msg) => msg._id === mid ? { ...msg, ...updatedMsg } : msg),
        }));
      } else {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId
              ? { ...msg, status, ...(queryType && { queryType }) }
              : msg
          ),
        }));
      }

      // If response contains inbox-level updates, merge into inboxes and selectedInbox
      const inboxUpdate = result?.inbox || result?.updatedInbox || null;
      const inboxIdFromResp = inboxUpdate?._id || result?.inboxId || inboxId;
      if (inboxUpdate || result?.inboxId) {
        set((state) => ({
          inboxes: state.inboxes.map((i) => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i),
          allInboxes: state.allInboxes.map((i) => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i),
          selectedInbox: state.selectedInbox?._id === inboxIdFromResp ? { ...state.selectedInbox, ...(inboxUpdate || {}) } : state.selectedInbox,
        }));
      }

      try { get().showToast && get().showToast('Message updated', 'success', 1400); } catch(e){}

      return result;
    } catch (error) {
      console.error('Failed to update message:', error);
      try { get().showToast && get().showToast('Failed to update message', 'error'); } catch(e){}
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
      set({ whatsappTemplates: templates });
      return templates;
    } catch (error) {
      console.error('Failed to fetch whatsapp templates:', error);
      set({ whatsappTemplates: [] });
      return [];
    }
  },

  // Send WhatsApp Template with parameters
  sendWhatsappTemplateWithParams: async (mobile, template) => {
    try {
      const result = await apiService.sendWhatsappTemplateWithParams(mobile, template);
      const msg = result?.message || result?.data || result;
      if (msg && (msg._id || msg.id)) {
        set((state) => ({ messages: [...state.messages, msg] }));
        const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
        if (inboxId) {
          set((state) => ({
            inboxes: state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i),
            selectedInbox: state.selectedInbox?._id === inboxId ? { ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt } : state.selectedInbox,
          }));
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to send whatsapp template:', error);
      throw error;
    }
  },

  // Get filtered inboxes based on activeFilter - local filtering without API calls
  getFilteredInboxes: () => {
    const { allInboxes, activeFilter } = get();
    
    if (!Array.isArray(allInboxes) || allInboxes.length === 0) {
      return [];
    }

    if (activeFilter === 'all') {
      // Return all inboxes regardless of status
      return allInboxes;
    }

    // Filter by specific status
    return allInboxes.filter(inbox => inbox.status === activeFilter);
  },

  // Ensure allInboxes is loaded - call this on app init or when needed
  ensureAllInboxesLoaded: async () => {
    const { allInboxes, fetchInboxes } = get();
    
    // If we don't have allInboxes cached, fetch them
    if (!Array.isArray(allInboxes) || allInboxes.length === 0) {
      try {
        await fetchInboxes({ status: '', forceFetch: false });
      } catch (error) {
        console.error('Failed to ensure all inboxes are loaded:', error);
        throw error;
      }
    }
  },
  
  // Dashboard Stats - matches API response format
  getDashboardStats: () => {
    const { dashboardData } = get();
    
    if (dashboardData) {
      const statusKeys = ['unread', 'read', 'resolved'];
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
        resolved: dashboardData.resolved || 0,
        channels,
        queryTypes,
      };
    }
    
    return {
      unread: 0,
      read: 0,
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
      allInboxes: state.allInboxes.map((i) => 
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
    const allInboxesExists = state.allInboxes.some(i => i._id === inbox._id);
    // Ensure new inboxes have status set to 'unread' by default
    const newInbox = {
      ...inbox,
      status: inbox.status || 'unread',
    };
    return {
      inboxes: exists ? state.inboxes : [newInbox, ...state.inboxes],
      allInboxes: allInboxesExists ? state.allInboxes : [newInbox, ...state.allInboxes],
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
