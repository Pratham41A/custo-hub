import { configureStore, createSlice } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import { apiService } from '../services/apiService';

// initial state mirrors the previous zustand store
const initialState = {
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
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    // basic setters
    setSubscriptions(state, action) { state.subscriptions = action.payload; },
    setPayments(state, action) { state.payments = action.payload; },
    setInboxes(state, action) { state.inboxes = action.payload; },
    setAllInboxes(state, action) { state.allInboxes = action.payload; },
    setWhatsappTemplates(state, action) { state.whatsappTemplates = action.payload; },
    setMessages(state, action) { state.messages = action.payload; },
    setViews(state, action) { state.views = action.payload; },
    setNotes(state, action) { state.notes = action.payload; },
    setQueryTypes(state, action) { state.queryTypes = action.payload; },
    setDashboardData(state, action) { state.dashboardData = action.payload; },
    setSelectedInbox(state, action) { state.selectedInbox = action.payload; },
    setActiveFilter(state, action) { state.activeFilter = action.payload; },
    setDateRange(state, action) { state.dateRange = action.payload; },
    setPagination(state, action) { state.pagination = action.payload; },
    setLoading(state, action) {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    showToast(state, action) { state.toast = action.payload; },
    setResolutionsForInbox(state, action) {
      const { inboxId, resolutions } = action.payload;
      state.resolutionsByInbox[inboxId] = resolutions;
    },
    // socket helpers
    handleInboxUpdated(state, action) {
      const inbox = action.payload;
      state.inboxes = state.inboxes.map(i =>
        i._id === inbox._id ? { ...i, ...inbox } : i
      );
      state.allInboxes = state.allInboxes.map(i =>
        i._id === inbox._id ? { ...i, ...inbox } : i
      );
      if (state.selectedInbox?._id === inbox._id) {
        state.selectedInbox = { ...state.selectedInbox, ...inbox };
      }
    },
    handleInboxCreated(state, action) {
      const inbox = action.payload;
      const exists = state.inboxes.some(i => i._id === inbox._id);
      const allExists = state.allInboxes.some(i => i._id === inbox._id);
      const newInbox = { ...inbox, status: inbox.status || 'unread' };
      if (!exists) state.inboxes = [newInbox, ...state.inboxes];
      if (!allExists) state.allInboxes = [newInbox, ...state.allInboxes];
    },
    handleMessageCreated(state, action) {
      const message = action.payload;
      const exists = state.messages.some(m => m._id === message._id);
      if (!exists) state.messages = [...state.messages, message];
    },
  },
});

// export actions for use in thunks and socketService
export const {
  setSubscriptions,
  setPayments,
  setInboxes,
  setAllInboxes,
  setWhatsappTemplates,
  setMessages,
  setViews,
  setNotes,
  setQueryTypes,
  setDashboardData,
  setSelectedInbox,
  setActiveFilter,
  setDateRange,
  setPagination,
  setLoading,
  showToast,
  setResolutionsForInbox,
  handleInboxUpdated,
  handleInboxCreated,
  handleMessageCreated,
} = globalSlice.actions;

// configure store
export const store = configureStore({
  reducer: { global: globalSlice.reducer },
});

// thunk helpers replicate original async methods

export const fetchDashboard = (options = {}) => async (dispatch, getState) => {
  dispatch(setLoading({ key: 'dashboard', value: true }));
  try {
    const { dateRange } = getState().global;
    const params = {
      startDate: options.startDate ?? dateRange.start ?? '',
      endDate: options.endDate ?? dateRange.end ?? '',
    };
    const data = await apiService.getDashboards(params);
    dispatch(setDashboardData(data));
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    throw error;
  } finally {
    dispatch(setLoading({ key: 'dashboard', value: false }));
  }
};

export const fetchInboxes = (options = {}) => async (dispatch, getState) => {
  dispatch(setLoading({ key: 'inboxes', value: true }));
  try {
    const state = getState().global;
    const { activeFilter, dateRange, pagination, allInboxes } = state;
    const params = {
      status: options.status ?? (activeFilter === 'all' ? '' : activeFilter),
      limit: options.limit ?? pagination.limit,
      skip: options.skip ?? pagination.skip,
      startDate: options.startDate ?? dateRange.start ?? '',
      endDate: options.endDate ?? dateRange.end ?? '',
    };

    const wantStatus = params.status;
    const force = !!options.forceFetch;
    if (wantStatus && !force && Array.isArray(allInboxes) && allInboxes.length > 0) {
      const filtered = allInboxes.filter(i => i.status === wantStatus);
      dispatch(setInboxes(filtered));
      return filtered;
    }

    if (!wantStatus && !force && Array.isArray(allInboxes) && allInboxes.length > 0) {
      dispatch(setInboxes(allInboxes));
      return allInboxes;
    }

    const data = await apiService.getInboxes(params);
    let inboxList = [];
    if (Array.isArray(data)) {
      inboxList = data;
    } else if (data?.inboxes && Array.isArray(data.inboxes)) {
      inboxList = data.inboxes;
    } else if (data?.data && Array.isArray(data.data)) {
      inboxList = data.data;
    }

    if (!wantStatus) {
      dispatch(setAllInboxes(inboxList));
    }
    dispatch(setInboxes(inboxList));
    try {
      dispatch(showToast({ text: 'Inboxes loaded', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return inboxList;
  } catch (error) {
    console.error('Failed to fetch inboxes:', error);
    try {
      dispatch(showToast({ text: 'Failed to fetch inboxes', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  } finally {
    dispatch(setLoading({ key: 'inboxes', value: false }));
  }
};

export const fetchMessages = (inboxId) => async (dispatch) => {
  dispatch(setLoading({ key: 'messages', value: true }));
  try {
    const data = await apiService.getMessages(inboxId);
    let messageList = data.messages || data.data || data || [];
    
    // Process draft messages: extract content and parse JSON if needed
    messageList = messageList.map(msg => {
      if (msg.isDraft && msg.content) {
        // Try to parse content as JSON (it might be a stringified draft object)
        let parsedContent = msg.content;
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed && typeof parsed === 'object') {
            parsedContent = parsed;
          }
        } catch (e) {
          // Not JSON, keep as is
        }
        
        return {
          ...msg,
          body: typeof parsedContent === 'object' ? parsedContent.body : parsedContent,
          content: parsedContent,
        };
      }
      return msg;
    });
    
    dispatch(setMessages(messageList));
    try {
      dispatch(showToast({ text: 'Messages loaded', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return messageList;
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    dispatch(setMessages([]));
    try {
      dispatch(showToast({ text: 'Failed to fetch messages', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  } finally {
    dispatch(setLoading({ key: 'messages', value: false }));
  }
};

export const updateInboxStatus = (inboxId, status, queryType = '', resolvedBy = '') => async (dispatch, getState) => {
  const state = getState().global;
  const prevInbox = Array.isArray(state.inboxes)
    ? state.inboxes.find(i => i._id === inboxId)
    : (state.inboxes?.data || []).find(i => i._id === inboxId);

  const updatedInboxes = state.inboxes.map(i =>
    i._id === inboxId ? { ...i, status, ...(queryType ? { queryType } : {}) } : i
  );
  const updatedAll = state.allInboxes.map(i =>
    i._id === inboxId ? { ...i, status, ...(queryType ? { queryType } : {}) } : i
  );
  const updatedSelected = state.selectedInbox?._id === inboxId
    ? { ...state.selectedInbox, status, ...(queryType ? { queryType } : {}) }
    : state.selectedInbox;
  dispatch(setInboxes(updatedInboxes));
  dispatch(setAllInboxes(updatedAll));
  dispatch(setSelectedInbox(updatedSelected));

  try {
    const response = await apiService.updateInbox({ inboxId, status, queryType, resolvedBy });
    const updatedInbox = response || {};
    dispatch(setInboxes(state.inboxes.map(i => i._id === inboxId ? { ...i, ...updatedInbox } : i)));
    dispatch(setAllInboxes(state.allInboxes.map(i => i._id === inboxId ? { ...i, ...updatedInbox } : i)));
    if (state.selectedInbox?._id === inboxId) {
      dispatch(setSelectedInbox({ ...state.selectedInbox, ...updatedInbox }));
    }
    try {
      dispatch(showToast({ text: `Inbox marked ${status}`, type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return updatedInbox;
  } catch (error) {
    dispatch(setInboxes(state.inboxes.map(i => i._id === inboxId ? { ...i, ...(prevInbox || {}) } : i)));
    if (state.selectedInbox?._id === inboxId) {
      dispatch(setSelectedInbox({ ...state.selectedInbox, ...(prevInbox || {}) }));
    }
    try {
      dispatch(showToast({ text: 'Failed to update inbox', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  }
};

export const fetchUserSubscriptions = (userId) => async (dispatch) => {
  try {
    const response = await apiService.getSubscriptions(userId);
    const subs = response.subscriptions || response.data || response || [];
    dispatch(setSubscriptions(subs));
    return { data: subs };
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return { data: [] };
  }
};

export const fetchUserPayments = (userId) => async (dispatch) => {
  try {
    const response = await apiService.getPayments(userId);
    const payments = response.payments || response.data || response || [];
    dispatch(setPayments(payments));
    return { data: payments };
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return { data: [] };
  }
};

export const fetchUserViews = (userId) => async (dispatch) => {
  try {
    const response = await apiService.getViews(userId);
    const viewsData = response.videoTracks || response.views || response.data || response || [];
    const views = Array.isArray(viewsData) ? viewsData : [];
    dispatch(setViews(views));
    return { data: views };
  } catch (error) {
    console.error('Failed to fetch views:', error);
    return { data: [] };
  }
};

export const fetchUserActivities = (inboxId) => async (dispatch) => {
  try {
    const response = await apiService.getActivities(inboxId);
    let notesData = response.activities || response.data || response || [];
    const notes = Array.isArray(notesData) ? notesData : [];
    dispatch(setNotes(notes));
    return { data: notes };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return { data: [] };
  }
};

export const fetchResolutions = (inboxId) => async (dispatch, getState) => {
  if (!inboxId) return [];
  const state = getState().global;
  if (state.resolutionsByInbox[inboxId] && Array.isArray(state.resolutionsByInbox[inboxId]) && state.resolutionsByInbox[inboxId].length > 0) {
    return state.resolutionsByInbox[inboxId];
  }
  try {
    const response = await apiService.fetchResolutions(inboxId);
    const list = Array.isArray(response.resolutions) ? response.resolutions : (Array.isArray(response) ? response : []);
    dispatch(setResolutionsForInbox({ inboxId, resolutions: list }));
    return list;
  } catch (error) {
    console.error('Failed to fetch resolutions:', error);
    dispatch(setResolutionsForInbox({ inboxId, resolutions: [] }));
    return [];
  }
};

export const sendWhatsappTemplate = (mobile, template) => async (dispatch, getState) => {
  try {
    const result = await apiService.sendWhatsappTemplate(mobile, template);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      const state = getState().global;
      dispatch(setMessages([...state.messages, msg]));
      const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
      if (inboxId) {
        const inboxes = state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        const allInboxes = state.allInboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        dispatch(setInboxes(inboxes));
        dispatch(setAllInboxes(allInboxes));
        if (state.selectedInbox?._id === inboxId) {
          dispatch(setSelectedInbox({ ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt }));
        }
      }
    }
    try {
      dispatch(showToast({ text: 'WhatsApp template sent', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    return result;
  } catch (error) {
    console.error('Failed to send WhatsApp template:', error);
    try {
      dispatch(showToast({ text: 'Failed to send WhatsApp template', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    throw error;
  }
};

export const sendWhatsappMessage = (mobile, body) => async (dispatch, getState) => {
  try {
    const result = await apiService.sendWhatsappMessage(mobile, body);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      const state = getState().global;
      dispatch(setMessages([...state.messages, msg]));
      const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
      if (inboxId) {
        const inboxes = state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        const allInboxes = state.allInboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        dispatch(setInboxes(inboxes));
        dispatch(setAllInboxes(allInboxes));
        if (state.selectedInbox?._id === inboxId) {
          dispatch(setSelectedInbox({ ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt }));
        }
      }
    }
    try {
      dispatch(showToast({ text: 'WhatsApp sent', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    return result;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    try {
      dispatch(showToast({ text: 'Failed to send WhatsApp message', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    throw error;
  }
};

export const sendEmailReply = (replyMessageId, htmlBody, toRecipients = '', ccRecipients = '', bccRecipients = '') => async (dispatch, getState) => {
  // normalize paragraph tags to divs as a safety measure
  if (htmlBody) {
    const normalized = htmlBody
      .replace(/<p([^>]*)>/gi, '<div$1>')
      .replace(/<\/p>/gi, '</div>');
    if (normalized !== htmlBody) {
      console.log('🔧 globalStore sending normalized reply body', { before: htmlBody, after: normalized });
      htmlBody = normalized;
    }
  }
  try {
    const result = await apiService.sendEmailReply(replyMessageId, htmlBody, toRecipients, ccRecipients, bccRecipients);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      const state = getState().global;
      dispatch(setMessages([...state.messages, msg]));
      const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
      if (inboxId) {
        const inboxes = state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        const allInboxes = state.allInboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        dispatch(setInboxes(inboxes));
        dispatch(setAllInboxes(allInboxes));
        if (state.selectedInbox?._id === inboxId) {
          dispatch(setSelectedInbox({ ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt }));
        }
      }
    }
    try {
      dispatch(showToast({ text: 'Reply sent', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    return result;
  } catch (error) {
    console.error('Failed to send email reply:', error);
    try {
      dispatch(showToast({ text: 'Failed to send reply', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    throw error;
  }
};

export const sendNewEmail = (email, subject, htmlBody, ccRecipients = '', bccRecipients = '') => async (dispatch, getState) => {
  // global normalization: replace any <p> tags before hitting the API
  if (htmlBody) {
    const normalized = htmlBody
      .replace(/<p([^>]*)>/gi, '<div$1>')
      .replace(/<\/p>/gi, '</div>');
    if (normalized !== htmlBody) {
      console.log('🔧 globalStore sending normalized new email body', { before: htmlBody, after: normalized });
      htmlBody = normalized;
    }
  }

  try {
    const result = await apiService.sendNewEmail(email, subject, htmlBody, ccRecipients, bccRecipients);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      const state = getState().global;
      dispatch(setMessages([...state.messages, msg]));
    }
    try {
      dispatch(showToast({ text: 'Email sent', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    return result;
  } catch (error) {
    console.error('Failed to send new email:', error);
    try {
      dispatch(showToast({ text: 'Failed to send email', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    throw error;
  }
};

export const updateMessage = (inboxId, messageId, status, queryType = '', resolvedBy = '') => async (dispatch, getState) => {
  try {
    const state = getState().global;
    const result = await apiService.updateInbox({ inboxId, messageId, status, queryType, resolvedBy });
    const updatedMsg = result?.message || result?.data || null;
    if (updatedMsg && (updatedMsg._id || updatedMsg.id)) {
      const mid = updatedMsg._id || updatedMsg.id;
      dispatch(setMessages(state.messages.map(msg => msg._id === mid ? { ...msg, ...updatedMsg } : msg)));
    } else {
      dispatch(setMessages(state.messages.map(msg =>
        msg._id === messageId
          ? { ...msg, status, ...(queryType && { queryType }) }
          : msg
      )));
    }
    const inboxUpdate = result?.inbox || result?.updatedInbox || null;
    const inboxIdFromResp = inboxUpdate?._id || result?.inboxId || inboxId;
    if (inboxUpdate || result?.inboxId) {
      dispatch(setInboxes(state.inboxes.map(i => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i)));
      dispatch(setAllInboxes(state.allInboxes.map(i => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i)));
      if (state.selectedInbox?._id === inboxIdFromResp) {
        dispatch(setSelectedInbox({ ...state.selectedInbox, ...(inboxUpdate || {}) }));
      }
    }
    try {
      dispatch(showToast({ text: 'Message updated', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    return result;
  } catch (error) {
    console.error('Failed to update message:', error);
    try {
      dispatch(showToast({ text: 'Failed to update message', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch(e){}
    throw error;
  }
};

export const createNote = (inboxId, body, dueDate) => async (dispatch, getState) => {
  try {
    const result = await apiService.createActivity(inboxId, body, dueDate);
    const state = getState().global;
    dispatch(setNotes([...state.notes, result]));
    return result;
  } catch (error) {
    console.error('Failed to create note:', error);
    throw error;
  }
};

export const fetchQueryTypes = () => async (dispatch) => {
  try {
    const response = await apiService.fetchQueryTypes();
    let queryTypes = [];
    if (response.queryTypes && Array.isArray(response.queryTypes)) {
      queryTypes = response.queryTypes;
    } else if (Array.isArray(response)) {
      queryTypes = response;
    } else if (response.data && Array.isArray(response.data)) {
      queryTypes = response.data;
    }
    dispatch(setQueryTypes(queryTypes));
    return queryTypes;
  } catch (error) {
    console.error('Failed to fetch query types:', error);
    return [];
  }
};

export const createQueryType = (name) => async (dispatch, getState) => {
  try {
    const response = await apiService.createQueryType(name);
    const newQueryType = response.data || response;
    const state = getState().global;
    dispatch(setQueryTypes([...state.queryTypes, newQueryType]));
    return newQueryType;
  } catch (error) {
    console.error('Failed to create query type:', error);
    throw error;
  }
};

export const fetchWhatsappTemplates = () => async (dispatch) => {
  try {
    const response = await apiService.fetchWhatsappTemplates();
    const templates = response.whatsappTemplates || response.templates || response || [];
    dispatch(setWhatsappTemplates(templates));
    return templates;
  } catch (error) {
    console.error('Failed to fetch whatsapp templates:', error);
    dispatch(setWhatsappTemplates([]));
    return [];
  }
};

export const sendWhatsappTemplateWithParams = (mobile, template) => async (dispatch, getState) => {
  try {
    const result = await apiService.sendWhatsappTemplateWithParams(mobile, template);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      const state = getState().global;
      dispatch(setMessages([...state.messages, msg]));
      const inboxId = msg.inboxId || msg.inbox || result?.inboxId;
      if (inboxId) {
        const inboxes = state.inboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        const allInboxes = state.allInboxes.map(i => i._id === inboxId ? { ...i, ...(msg.inbox || {}), updatedAt: msg.updatedAt || i.updatedAt } : i);
        dispatch(setInboxes(inboxes));
        dispatch(setAllInboxes(allInboxes));
        if (state.selectedInbox?._id === inboxId) {
          dispatch(setSelectedInbox({ ...state.selectedInbox, ...(msg.inbox || {}), updatedAt: msg.updatedAt || state.selectedInbox.updatedAt }));
        }
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to send whatsapp template:', error);
    throw error;
  }
};

// selectors implemented as functions produced inside hook

// custom hook to use in components
export const useGlobalStore = (selector) => {
  const dispatch = useDispatch();
  const state = useSelector(s => s.global);

  // computed helpers that depend on current state
  const getDashboardStats = () => {
    const { dashboardData } = state;
    if (dashboardData) {
      const statusKeys = ['unread', 'read', 'resolved'];
      const channelKeys = ['whatsapp', 'email', 'web'];
      const channels = channelKeys
        .filter(key => dashboardData[key] !== undefined)
        .map(key => ({ _id: key, count: dashboardData[key] || 0 }));
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
    return { unread: 0, read: 0, resolved: 0, channels: [], queryTypes: [] };
  };

  const getFilteredInboxes = () => {
    const { allInboxes, activeFilter } = state;
    if (!Array.isArray(allInboxes) || allInboxes.length === 0) return [];
    if (activeFilter === 'all') return allInboxes;
    return allInboxes.filter(inbox => inbox.status === activeFilter);
  };

  const ensureAllInboxesLoaded = async () => {
    if (!Array.isArray(state.allInboxes) || state.allInboxes.length === 0) {
      return dispatch(fetchInboxes({ status: '', forceFetch: false }));
    }
  };

  const actions = {
    showToast: (text, type = 'info', duration = 2000) => {
      dispatch(showToast({ text, type }));
      try {
        setTimeout(() => dispatch(showToast({ text: '', type: '' })), duration);
      } catch (e) {}
    },
    setLoading: (key, value) => dispatch(setLoading({ key, value })),
    setSubscriptions: (v) => dispatch(setSubscriptions(v)),
    setPayments: (v) => dispatch(setPayments(v)),
    setInboxes: (v) => dispatch(setInboxes(v)),
    setAllInboxes: (v) => dispatch(setAllInboxes(v)),
    setMessages: (v) => dispatch(setMessages(v)),
    setViews: (v) => dispatch(setViews(v)),
    setNotes: (v) => dispatch(setNotes(v)),
    setQueryTypes: (v) => dispatch(setQueryTypes(v)),
    setWhatsappTemplates: (v) => dispatch(setWhatsappTemplates(v)),
    setResolutionsForInbox: (id, res) => dispatch(setResolutionsForInbox({ inboxId: id, resolutions: res })),
    setDashboardData: (v) => dispatch(setDashboardData(v)),
    setSelectedInbox: (v) => dispatch(setSelectedInbox(v)),
    setActiveFilter: (v) => dispatch(setActiveFilter(v)),
    setDateRange: (v) => dispatch(setDateRange(v)),
    setPagination: (v) => dispatch(setPagination(v)),
    fetchDashboard: (opts) => dispatch(fetchDashboard(opts)),
    fetchInboxes: (opts) => dispatch(fetchInboxes(opts)),
    fetchMessages: (id) => dispatch(fetchMessages(id)),
    updateInboxStatus: (id, status, qt, rb) => dispatch(updateInboxStatus(id, status, qt, rb)),
    fetchUserSubscriptions: (u) => dispatch(fetchUserSubscriptions(u)),
    fetchUserPayments: (u) => dispatch(fetchUserPayments(u)),
    fetchUserViews: (u) => dispatch(fetchUserViews(u)),
    fetchUserActivities: (i) => dispatch(fetchUserActivities(i)),
    fetchResolutions: (i) => dispatch(fetchResolutions(i)),
    sendWhatsappTemplate: (m, t) => dispatch(sendWhatsappTemplate(m, t)),
    sendWhatsappMessage: (m, b) => dispatch(sendWhatsappMessage(m, b)),
    sendEmailReply: (r, h, e, cc = '', bcc = '') => dispatch(sendEmailReply(r, h, e, cc, bcc)),
    sendNewEmail: (e, s, h, cc = '', bcc = '') => dispatch(sendNewEmail(e, s, h, cc, bcc)),
    createNote: (i, b, d) => dispatch(createNote(i, b, d)),
    fetchQueryTypes: () => dispatch(fetchQueryTypes()),
    createQueryType: (n) => dispatch(createQueryType(n)),
    fetchWhatsappTemplates: () => dispatch(fetchWhatsappTemplates()),
    sendWhatsappTemplateWithParams: (m, t) => dispatch(sendWhatsappTemplateWithParams(m, t)),
    updateMessage: (i, m, s, q, r) => dispatch(updateMessage(i, m, s, q, r)),
    getDashboardStats,
    getFilteredInboxes,
    ensureAllInboxesLoaded,
  };

  const combined = { ...state, ...actions };
  return selector ? selector(combined) : combined;
};
