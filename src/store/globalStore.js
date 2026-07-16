import { configureStore, createSlice } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import { apiService } from '../services/apiService';

const getDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const display = getDisplayValue(item);
      if (display) return display;
    }
    return '';
  }
  if (typeof value === 'object') {
    return getDisplayValue(
      value.name ??
      value.value ??
      value.label ??
      value.fullname ??
      value.email ??
      value._id ??
      value.id
    );
  }
  return String(value);
};

const getLatestItem = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a?.updatedAt || a?.createdAt || '') || 0;
    const bTime = Date.parse(b?.updatedAt || b?.createdAt || '') || 0;
    return bTime - aTime;
  })[0];
};

const getMessageIdValue = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || value.messageId || '';
  return String(value);
};

const mergeUniqueItems = (existing = [], incoming = []) => {
  const merged = [];
  const seen = new Set();
  const items = [...existing, ...incoming];

  items.forEach((item) => {
    const key = item?._id || item?.id || item?.messageId || item?.uuid;
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }
    merged.push(item);
  });

  return merged;
};

const normalizePaginationMeta = (response = {}, fallbackPage = 1, fallbackLimit = 10, fallbackCount = 0) => {
  const page = Number(response?.page ?? response?.pagination?.page ?? fallbackPage) || 1;
  const limit = Number(response?.limit ?? response?.pagination?.limit ?? fallbackLimit) || 10;
  const totalCount = Number(response?.totalCount ?? response?.count ?? response?.total ?? fallbackCount) || 0;
  const totalPages = Number(response?.totalPages ?? response?.pagination?.totalPages ?? (totalCount > 0 ? Math.ceil(totalCount / limit) : 1)) || 1;
  const hasMoreFromServer = response?.hasMore ?? response?.pagination?.hasMore;
  const hasMore = hasMoreFromServer !== undefined && hasMoreFromServer !== null
    ? Boolean(hasMoreFromServer)
    : page < totalPages;

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasMore: Boolean(hasMore),
  };
};

const findResolutionForMessage = (msg, resolutions = []) => {
  if (!msg || !Array.isArray(resolutions)) return null;
  const messageIds = [msg._id, msg.id, msg.messageId, msg.internetMessageId, msg.outlookMessageId]
    .filter(Boolean)
    .map(String);

  return resolutions.find((resolution) => {
    const resolutionMessageIds = [
      resolution?.messageId,
      resolution?.message,
      resolution?.message_id,
      resolution?.emailMessageId,
      resolution?.outlookMessageId,
      resolution?.internetMessageId,
    ].map(getMessageIdValue).filter(Boolean).map(String);

    return resolutionMessageIds.some((id) => messageIds.includes(id));
  }) || null;
};

const normalizeResolvedMessageFields = (msg, fallback = {}) => {
  if (!msg || typeof msg !== 'object') return msg;

  const latestResolution = getLatestItem(msg.resolutions);
  const sources = [
    msg,
    msg.resolution,
    msg.resolvedDetails,
    msg.resolvedInfo,
    msg.messageResolution,
    msg.metadata?.resolution,
    msg.meta?.resolution,
    latestResolution,
    fallback,
  ].filter(Boolean);

  const readFromSources = (...keys) => {
    for (const source of sources) {
      for (const key of keys) {
        const display = getDisplayValue(source?.[key]);
        if (display) return display;
      }
    }
    return '';
  };

  const queryType = readFromSources('queryType', 'query_type', 'queryTypes', 'query_types', 'type', 'category');
  const resolvedBy = readFromSources('resolvedBy', 'resolved_by', 'resolvedby', 'resolvedByName', 'resolver', 'by', 'user', 'createdBy', 'updatedBy');
  const status = getDisplayValue(msg.status) || getDisplayValue(fallback.status);

  return {
    ...msg,
    ...(status ? { status } : {}),
    ...(queryType ? { queryType } : {}),
    ...(resolvedBy ? { resolvedBy } : {}),
  };
};

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
    statusUpdate: false,
  },

  // Progressive loading flags
  allInboxesFullyLoaded: false,

  // UI State
  selectedInbox: null,
  activeFilter: 'all',
  dateRange: { start: null, end: null },
  pagination: { skip: 0, limit: 10, page: 1, totalCount: 0, totalPages: 1, hasMore: false },
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
    setPagination(state, action) { state.pagination = { ...state.pagination, ...action.payload }; },
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
    setAllInboxesFullyLoaded(state, action) {
      state.allInboxesFullyLoaded = action.payload;
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
  setAllInboxesFullyLoaded,
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
  const isAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
  if (!isAppend) {
    dispatch(setLoading({ key: 'inboxes', value: true }));
  }
  try {
    const state = getState().global;
    const { activeFilter, dateRange, pagination, allInboxes } = state;
    const page = options.page ?? pagination.page ?? 1;
    const limit = options.limit ?? pagination.limit ?? 10;
    const params = {
      status: options.status ?? (activeFilter === 'all' ? '' : activeFilter),
      page,
      limit,
      skip: options.skip ?? ((page - 1) * limit),
      startDate: options.startDate ?? dateRange.start ?? '',
      endDate: options.endDate ?? dateRange.end ?? '',
    };

    const wantStatus = params.status;
    const force = !!options.forceFetch;
    const shouldUseCache = !force && !options.page && !options.limit && !options.skip && Array.isArray(allInboxes) && allInboxes.length > 0;
    if (wantStatus && shouldUseCache) {
      const filtered = allInboxes.filter(i => i.status === wantStatus);
      dispatch(setInboxes(filtered));
      return { data: filtered, pagination: { page: 1, limit, totalCount: filtered.length, totalPages: 1, hasMore: false } };
    }

    if (!wantStatus && shouldUseCache) {
      dispatch(setInboxes(allInboxes));
      return { data: allInboxes, pagination: { page: 1, limit, totalCount: allInboxes.length, totalPages: 1, hasMore: false } };
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

    const paginationMeta = normalizePaginationMeta(data, page, limit, inboxList.length);

    const shouldAppend = Boolean(options.append || page > 1);
    console.log('[pagination][inboxes]', { page, limit, isAppend: shouldAppend, count: inboxList.length, paginationMeta, status: params.status });
    const nextInboxes = shouldAppend ? mergeUniqueItems(state.inboxes, inboxList) : inboxList;
    const nextAllInboxes = shouldAppend && !wantStatus ? mergeUniqueItems(state.allInboxes, inboxList) : (wantStatus ? state.allInboxes : inboxList);

    if (!wantStatus) {
      dispatch(setAllInboxes(nextAllInboxes));
    }
    dispatch(setInboxes(nextInboxes));
    dispatch(setPagination({ ...paginationMeta, skip: (paginationMeta.page - 1) * paginationMeta.limit }));
    try {
      dispatch(showToast({ text: 'Inboxes loaded', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return { data: inboxList, pagination: paginationMeta };
  } catch (error) {
    console.error('Failed to fetch inboxes:', error);
    try {
      dispatch(showToast({ text: 'Failed to fetch inboxes', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  } finally {
    if (!isAppend) {
      dispatch(setLoading({ key: 'inboxes', value: false }));
    }
  }
};

// Progressive loading: Load read/unread first, then all inboxes in background
export const loadInboxesProgressively = () => async (dispatch, getState) => {
  const state = getState().global;
  const { activeFilter } = state;
  
  // Step 1: Show loading state and fetch read + unread statuses first
  dispatch(setLoading({ key: 'inboxes', value: true }));
  
  try {
    // First, determine what statuses to load initially
    // If filter is 'all' or 'resolved', show read+unread first
    // If filter is specific (read/unread), show that first
    const initialStatuses = activeFilter === 'all' || activeFilter === 'resolved' 
      ? ['read', 'unread'] 
      : [activeFilter];
    
    // Fetch initial inboxes (read + unread or specific status)
    const initialPromises = initialStatuses.map(status => 
      apiService.getInboxes({ status })
    );
    
    let initialInboxes = [];
    try {
      const results = await Promise.all(initialPromises);
      results.forEach(data => {
        let inboxList = [];
        if (Array.isArray(data)) {
          inboxList = data;
        } else if (data?.inboxes && Array.isArray(data.inboxes)) {
          inboxList = data.inboxes;
        } else if (data?.data && Array.isArray(data.data)) {
          inboxList = data.data;
        }
        initialInboxes = [...initialInboxes, ...inboxList];
      });
    } catch (err) {
      console.error('Failed to fetch initial inboxes:', err);
    }
    
    // Display initial inboxes (read + unread)
    dispatch(setInboxes(initialInboxes));
    dispatch(setAllInboxes(initialInboxes));
    dispatch(setLoading({ key: 'inboxes', value: false }));
    
    // Step 2: Fetch ALL inboxes in background (without setting loading state)
    // This won't block the UI or cause visual disruption
    (async () => {
      try {
        const allData = await apiService.getInboxes({ status: '' });
        let allInboxes = [];
        if (Array.isArray(allData)) {
          allInboxes = allData;
        } else if (allData?.inboxes && Array.isArray(allData.inboxes)) {
          allInboxes = allData.inboxes;
        } else if (allData?.data && Array.isArray(allData.data)) {
          allInboxes = allData.data;
        }
        
        // Update state with all inboxes
        dispatch(setAllInboxes(allInboxes));
        
        // Update displayed inboxes based on current filter (don't disrupt user)
        const currentState = getState().global;
        const currentFilter = currentState.activeFilter;
        
        if (currentFilter === 'all') {
          dispatch(setInboxes(allInboxes));
        } else {
          const filtered = allInboxes.filter(i => i.status === currentFilter);
          dispatch(setInboxes(filtered));
        }
        
        // Mark as fully loaded
        dispatch(setAllInboxesFullyLoaded(true));
        
        console.log('✅ All inboxes loaded progressively in background');
      } catch (err) {
        console.error('Failed to fetch all inboxes in background:', err);
        dispatch(setAllInboxesFullyLoaded(false));
      }
    })();
    
    return initialInboxes;
  } catch (error) {
    console.error('Failed to load inboxes progressively:', error);
    dispatch(setLoading({ key: 'inboxes', value: false }));
    try {
      dispatch(showToast({ text: 'Failed to fetch inboxes', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  }
};

export const fetchMessages = (inboxId, options = {}) => async (dispatch, getState) => {
  const isAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
  if (!isAppend) {
    dispatch(setLoading({ key: 'messages', value: true }));
  }
  try {
    const state = getState().global;
    const data = await apiService.getMessages(inboxId, options);
    let messageList = data?.messages || data?.data || data || [];
    const resolutionList = Array.isArray(data?.resolutions)
      ? data.resolutions
      : Array.isArray(data?.resolution)
        ? data.resolution
        : [];
    
    // Process draft messages: extract content and parse JSON if needed
    messageList = messageList.map(msg => {
      const matchingResolution = findResolutionForMessage(msg, resolutionList);
      const normalizeMessage = (message) => normalizeResolvedMessageFields(message, matchingResolution || {});

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
        
        return normalizeMessage({
          ...msg,
          body: typeof parsedContent === 'object' ? parsedContent.body : parsedContent,
          content: parsedContent,
        });
      }
      // Ensure WhatsApp messages have contentType='special' for formatting support
      if (msg.source === 'whatsapp' && !msg.contentType) {
        return normalizeMessage({ ...msg, contentType: 'special' });
      }
      return normalizeMessage(msg);
    });
    
    const paginationMeta = normalizePaginationMeta(data, options.page || 1, options.limit || 10, messageList.length);
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    console.log('[pagination][messages]', { inboxId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: messageList.length, paginationMeta });
    const nextMessages = shouldAppend ? mergeUniqueItems(state.messages, messageList) : messageList;
    dispatch(setMessages(nextMessages));
    try {
      dispatch(showToast({ text: 'Messages loaded', type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return {
      data: messageList,
      pagination: paginationMeta,
    };
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    try {
      dispatch(showToast({ text: 'Failed to fetch messages', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  } finally {
    if (!isAppend) {
      dispatch(setLoading({ key: 'messages', value: false }));
    }
  }
};

export const updateInboxStatus = (inboxId, status, queryType = '', resolvedBy = '') => async (dispatch, getState) => {
  const state = getState().global;
  const oldStatus = state.selectedInbox?._id === inboxId ? state.selectedInbox?.status : null;
  dispatch(setLoading({ key: 'statusUpdate', value: true }));

  try {
    // Call API and wait for 200 response
    const response = await apiService.updateInbox({ inboxId, status, queryType, resolvedBy });
    const updatedInbox = response || {};
    
    // Apply status and queryType to inbox
    const inboxUpdate = {
      ...updatedInbox,
      status: updatedInbox.status || status,
      ...(queryType ? { queryType } : {})
    };
    
    // Update state after successful API response
    dispatch(setInboxes(state.inboxes.map(i =>
      i._id === inboxId ? { ...i, ...inboxUpdate } : i
    )));
    dispatch(setAllInboxes(state.allInboxes.map(i =>
      i._id === inboxId ? { ...i, ...inboxUpdate } : i
    )));
    if (state.selectedInbox?._id === inboxId) {
      dispatch(setSelectedInbox({ ...state.selectedInbox, ...inboxUpdate }));
    }

    const newState = getState().global;
    const newInbox = newState.selectedInbox;
    if (newInbox && oldStatus && oldStatus !== newInbox.status && newInbox.status) {
      const currentFilter = newState.activeFilter;
      if (currentFilter !== newInbox.status) {
        dispatch(setActiveFilter(newInbox.status));
      }
    }
    
    try {
      dispatch(showToast({ text: `Inbox marked ${status}`, type: 'success' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    return inboxUpdate;
  } catch (error) {
    try {
      dispatch(showToast({ text: 'Failed to update inbox', type: 'error' }));
      setTimeout(() => dispatch(showToast({ text: '', type: '' })), 2000);
    } catch (e) {}
    throw error;
  } finally {
    dispatch(setLoading({ key: 'statusUpdate', value: false }));
  }
};

export const fetchUserSubscriptions = (userId, options = {}) => async (dispatch, getState) => {
  try {
    const state = getState().global;
    const response = await apiService.getSubscriptions(userId, options);
    const subs = response?.subscriptions || response?.data || response || [];
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    const nextSubs = shouldAppend ? mergeUniqueItems(state.subscriptions, subs) : subs;
    dispatch(setSubscriptions(nextSubs));
    const pagination = normalizePaginationMeta(response, options.page || 1, options.limit || 10, subs.length);
    console.log('[pagination][subscriptions]', { userId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: subs.length, pagination });
    return {
      data: subs,
      pagination,
    };
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return { data: [] };
  }
};

export const fetchUserPayments = (userId, options = {}) => async (dispatch, getState) => {
  try {
    const state = getState().global;
    const response = await apiService.getPayments(userId, options);
    const payments = response?.payments || response?.data || response || [];
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    const nextPayments = shouldAppend ? mergeUniqueItems(state.payments, payments) : payments;
    dispatch(setPayments(nextPayments));
    const pagination = normalizePaginationMeta(response, options.page || 1, options.limit || 10, payments.length);
    console.log('[pagination][payments]', { userId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: payments.length, pagination });
    return {
      data: payments,
      pagination,
    };
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return { data: [] };
  }
};

export const fetchUserViews = (userId, options = {}) => async (dispatch, getState) => {
  try {
    const state = getState().global;
    const response = await apiService.getViews(userId, options);
    const viewsData = response?.videoTracks || response?.views || response?.data || response || [];
    const views = Array.isArray(viewsData) ? viewsData : [];
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    const nextViews = shouldAppend ? mergeUniqueItems(state.views, views) : views;
    dispatch(setViews(nextViews));
    const pagination = normalizePaginationMeta(response, options.page || 1, options.limit || 10, views.length);
    console.log('[pagination][views]', { userId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: views.length, pagination });
    return {
      data: views,
      pagination,
    };
  } catch (error) {
    console.error('Failed to fetch views:', error);
    return { data: [] };
  }
};

export const fetchUserActivities = (inboxId, options = {}) => async (dispatch, getState) => {
  try {
    const state = getState().global;
    const response = await apiService.getActivities(inboxId, options);
    let notesData = response?.activities || response?.data || response || [];
    const notes = Array.isArray(notesData) ? notesData : [];
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    const nextNotes = shouldAppend ? mergeUniqueItems(state.notes, notes) : notes;
    dispatch(setNotes(nextNotes));
    const pagination = normalizePaginationMeta(response, options.page || 1, options.limit || 10, notes.length);
    console.log('[pagination][notes]', { inboxId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: notes.length, pagination });
    return {
      data: notes,
      pagination,
    };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return { data: [] };
  }
};

export const fetchResolutions = (inboxId, options = {}) => async (dispatch, getState) => {
  if (!inboxId) return [];
  const state = getState().global;
  if (!options.page && !options.limit && state.resolutionsByInbox[inboxId] && Array.isArray(state.resolutionsByInbox[inboxId]) && state.resolutionsByInbox[inboxId].length > 0) {
    return state.resolutionsByInbox[inboxId];
  }
  try {
    const state = getState().global;
    const response = await apiService.fetchResolutions(inboxId, options);
    const list = Array.isArray(response?.resolutions) ? response.resolutions : (Array.isArray(response) ? response : []);
    const existing = Array.isArray(state.resolutionsByInbox[inboxId]) ? state.resolutionsByInbox[inboxId] : [];
    const shouldAppend = Boolean(options.append || (options.page && Number(options.page) > 1));
    const nextResolutions = shouldAppend ? mergeUniqueItems(existing, list) : list;
    dispatch(setResolutionsForInbox({ inboxId, resolutions: nextResolutions }));
    const pagination = normalizePaginationMeta(response, options.page || 1, options.limit || 10, list.length);
    console.log('[pagination][resolutions]', { inboxId, page: options.page || 1, limit: options.limit || 10, isAppend: shouldAppend, count: list.length, pagination });
    return {
      data: list,
      pagination,
    };
  } catch (error) {
    console.error('Failed to fetch resolutions:', error);
    dispatch(setResolutionsForInbox({ inboxId, resolutions: [] }));
    return { data: [], pagination: { page: 1, limit: options.limit || 10, totalCount: 0, totalPages: 1, hasMore: false } };
  }
};

export const sendWhatsappTemplate = (mobile, template) => async (dispatch, getState) => {
  try {
    const result = await apiService.sendWhatsappTemplate(mobile, template);
    const msg = result?.message || result?.data || result;
    if (msg && (msg._id || msg.id)) {
      // Ensure WhatsApp template messages have contentType='special' for formatting support
      if (!msg.contentType) {
        msg.contentType = 'special';
      }
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
      // Ensure WhatsApp messages have contentType='special' for formatting support
      if (!msg.contentType) {
        msg.contentType = 'special';
      }
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
  dispatch(setLoading({ key: 'statusUpdate', value: true }));
  try {
    const state = getState().global;
    const oldStatus = state.selectedInbox?._id === inboxId ? state.selectedInbox?.status : null;
    
    // Call API and wait for response
    const result = await apiService.updateInbox({ inboxId, messageId, status, queryType, resolvedBy });
    
    // Apply backend controller logic to update inbox status based on message status change
    const updateInboxFromMessage = (inbox) => {
      if (!inbox) return inbox;
      const copy = { ...inbox };
      copy.total = copy.total ? { ...copy.total } : { read: 0, unread: 0 };

      if (status === 'read') {
        // message.status = 'read'
        if ((copy.total.unread || 0) === 1 && (copy.whatsappStatus === 'read' || !copy.whatsappStatus)) {
          copy.status = 'read';
        }
        copy.total.read = (copy.total.read || 0) + 1;
        copy.total.unread = Math.max(0, (copy.total.unread || 0) - 1);
      }
      else if (status === 'unread') {
        // message.status = 'unread'
        copy.total.unread = (copy.total.unread || 0) + 1;
        copy.total.read = Math.max(0, (copy.total.read || 0) - 1);
        copy.status = 'unread';
      }
      else if (status === 'ignore') {
        // message.status = undefined
        if ((copy.total.unread || 0) === 1) {
          if ((copy.total.read || 0) === 0) {
            if (copy.whatsappStatus) {
              copy.status = copy.whatsappStatus;
            } else {
              if (['resolved','read'].includes(copy.status)) {
                copy.status = copy.status;
              } else {
                copy.status = 'read';
              }
            }
          } else if ((copy.total.read || 0) > 0) {
            if (['unread','read'].includes(copy.whatsappStatus)) {
              copy.status = copy.whatsappStatus;
            } else {
              copy.status = 'read';
            }
          }
        }
        copy.total.unread = Math.max(0, (copy.total.unread || 0) - 1);
      }
      else if (status === 'resolved') {
        // message.status = 'resolved'
        copy.queryType = queryType || copy.queryType;

        if ((copy.total.read || 0) === 1) {
          if ((copy.total.unread || 0) === 0) {
            if (copy.whatsappStatus) {
              if (copy.whatsappStatus === 'resolved') {
                copy.source = '';
              }
              copy.status = copy.whatsappStatus;
            } else {
              copy.status = 'resolved';
              copy.source = '';
            }
          }
        }
        copy.total.read = Math.max(0, (copy.total.read || 0) - 1);
      }

      return copy;
    };

    const fallbackMessageFields = {
      status: status === 'ignore' ? undefined : status,
      queryType,
      resolvedBy,
    };

    // Update message status
    dispatch(setMessages(state.messages.map(msg =>
      msg._id === messageId
        ? normalizeResolvedMessageFields({
            ...msg,
            status: status === 'ignore' ? undefined : status,
            ...(queryType ? { queryType } : {}),
            ...(resolvedBy ? { resolvedBy } : {})
          }, fallbackMessageFields)
        : msg
    )));

    // Apply backend logic to inbox
    const currentInbox = state.inboxes.find(i => i._id === inboxId);
    if (currentInbox) {
      const updatedInbox = updateInboxFromMessage(currentInbox);
      dispatch(setInboxes(state.inboxes.map(i => i._id === inboxId ? updatedInbox : i)));
      dispatch(setAllInboxes(state.allInboxes.map(i => i._id === inboxId ? updatedInbox : i)));
      if (state.selectedInbox?._id === inboxId) {
        dispatch(setSelectedInbox(updatedInbox));
      }
    }

    // Also apply server-provided updates if present
    const updatedMsg = result?.message || result?.data || null;
    if (updatedMsg && (updatedMsg._id || updatedMsg.id)) {
      const mid = updatedMsg._id || updatedMsg.id;
      const normalizedUpdatedMsg = normalizeResolvedMessageFields(updatedMsg, fallbackMessageFields);
      dispatch(setMessages(getState().global.messages.map(msg =>
        msg._id === mid ? normalizeResolvedMessageFields({ ...msg, ...normalizedUpdatedMsg }, fallbackMessageFields) : msg
      )));
    }

    const inboxUpdate = result?.inbox || result?.updatedInbox || null;
    const inboxIdFromResp = inboxUpdate?._id || result?.inboxId || inboxId;
    if (inboxUpdate || result?.inboxId) {
      dispatch(setInboxes(getState().global.inboxes.map(i => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i)));
      dispatch(setAllInboxes(getState().global.allInboxes.map(i => i._id === inboxIdFromResp ? { ...i, ...(inboxUpdate || {}) } : i)));
      if (getState().global.selectedInbox?._id === inboxIdFromResp) {
        dispatch(setSelectedInbox({ ...getState().global.selectedInbox, ...(inboxUpdate || {}) }));
      }
    }

    const newState = getState().global;
    const newInbox = newState.selectedInbox;
    if (newInbox && oldStatus && oldStatus !== newInbox.status && newInbox.status) {
      const currentFilter = newState.activeFilter;
      if (currentFilter !== newInbox.status) {
        dispatch(setActiveFilter(newInbox.status));
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
  } finally {
    dispatch(setLoading({ key: 'statusUpdate', value: false }));
  }
};

export const createNote = (inboxId, body, dueDate) => async (dispatch, getState) => {
  // NOTE: dueDate should already be converted to UTC ISO string by the caller
  // This conversion happens in InboxPage.jsx using convertISTtoUTC utility
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
      // Ensure WhatsApp template messages have contentType='special' for formatting support
      if (!msg.contentType) {
        msg.contentType = 'special';
      }
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
    loadInboxesProgressively: () => dispatch(loadInboxesProgressively()),
    fetchMessages: (id, opts = {}) => dispatch(fetchMessages(id, opts)),
    updateInboxStatus: (id, status, qt, rb) => dispatch(updateInboxStatus(id, status, qt, rb)),
    fetchUserSubscriptions: (u, opts = {}) => dispatch(fetchUserSubscriptions(u, opts)),
    fetchUserPayments: (u, opts = {}) => dispatch(fetchUserPayments(u, opts)),
    fetchUserViews: (u, opts = {}) => dispatch(fetchUserViews(u, opts)),
    fetchUserActivities: (i, opts = {}) => dispatch(fetchUserActivities(i, opts)),
    fetchResolutions: (i, opts = {}) => dispatch(fetchResolutions(i, opts)),
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
