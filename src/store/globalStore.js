import { create } from 'zustand';
import { mockUsers, mockSubscriptions, mockPayments, mockInboxes, mockMessages, mockViews, mockNotes, mockQueryTypes } from '@/data/mockData';

export const useGlobalStore = create((set, get) => ({
  // Initial Data
  users: mockUsers,
  subscriptions: mockSubscriptions,
  payments: mockPayments,
  inboxes: mockInboxes,
  messages: mockMessages,
  views: mockViews,
  notes: mockNotes,
  queryTypes: mockQueryTypes,
  
  // UI State
  selectedInbox: null,
  selectedUser: null,
  activeFilter: 'all',
  dateRange: { start: null, end: null },
  
  // Setters
  setUsers: (users) => set({ users }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setPayments: (payments) => set({ payments }),
  setInboxes: (inboxes) => set({ inboxes }),
  setMessages: (messages) => set({ messages }),
  setViews: (views) => set({ views }),
  setNotes: (notes) => set({ notes }),
  setQueryTypes: (queryTypes) => set({ queryTypes }),
  
  setSelectedInbox: (inbox) => set({ selectedInbox: inbox }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setDateRange: (range) => set({ dateRange: range }),
  
  // Inbox Operations
  updateInboxStatus: (inboxId, status) => set((state) => ({
    inboxes: state.inboxes.map((inbox) =>
      inbox.id === inboxId ? { ...inbox, status, updated_at: new Date().toISOString() } : inbox
    ),
    selectedInbox: state.selectedInbox?.id === inboxId 
      ? { ...state.selectedInbox, status, updated_at: new Date().toISOString() }
      : state.selectedInbox,
  })),
  
  addInbox: (inbox) => set((state) => ({
    inboxes: [inbox, ...state.inboxes],
  })),
  
  // Message Operations
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  // Note Operations
  addNote: (note) => set((state) => ({
    notes: [...state.notes, note],
  })),
  
  // Inbox Source Update
  updateInboxSource: (inboxId, source) => set((state) => ({
    inboxes: state.inboxes.map((inbox) =>
      inbox.id === inboxId && !inbox.isInitiated 
        ? { ...inbox, source, isInitiated: true, updated_at: new Date().toISOString() } 
        : inbox
    ),
    selectedInbox: state.selectedInbox?.id === inboxId && !state.selectedInbox.isInitiated
      ? { ...state.selectedInbox, source, isInitiated: true, updated_at: new Date().toISOString() }
      : state.selectedInbox,
  })),
  
  // Query Type Operations
  addQueryType: (queryType) => set((state) => ({
    queryTypes: [...state.queryTypes, queryType],
  })),
  
  // Dashboard Stats
  getDashboardStats: () => {
    const { inboxes } = get();
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
    
    // Calculate query type stats
    inboxes
      .filter((i) => i.status === 'resolved')
      .forEach((inbox) => {
        inbox.query_types.forEach((qt) => {
          stats.queryTypeStats[qt] = (stats.queryTypeStats[qt] || 0) + 1;
        });
      });
    
    return stats;
  },
  
  // Socket Event Handlers
  handleInboxUpdated: (inbox) => set((state) => ({
    inboxes: state.inboxes.map((i) => (i.id === inbox.id ? inbox : i)),
    selectedInbox: state.selectedInbox?.id === inbox.id ? inbox : state.selectedInbox,
  })),
  
  handleInboxCreated: (inbox) => set((state) => ({
    inboxes: [inbox, ...state.inboxes],
  })),
  
  handleMessageCreated: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
}));
