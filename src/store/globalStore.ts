import { create } from 'zustand';
import { User, Subscription, Payment, Inbox, Message, View, Activity, QueryType, DashboardStats } from '@/types';
import { mockUsers, mockSubscriptions, mockPayments, mockInboxes, mockMessages, mockViews, mockActivities, mockQueryTypes } from '@/data/mockData';

interface GlobalState {
  // Data
  users: User[];
  subscriptions: Subscription[];
  payments: Payment[];
  inboxes: Inbox[];
  messages: Message[];
  views: View[];
  activities: Activity[];
  queryTypes: QueryType[];
  
  // UI State
  selectedInbox: Inbox | null;
  selectedUser: User | null;
  activeFilter: string;
  dateRange: { start: Date | null; end: Date | null };
  
  // Actions
  setUsers: (users: User[]) => void;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  setPayments: (payments: Payment[]) => void;
  setInboxes: (inboxes: Inbox[]) => void;
  setMessages: (messages: Message[]) => void;
  setViews: (views: View[]) => void;
  setActivities: (activities: Activity[]) => void;
  setQueryTypes: (queryTypes: QueryType[]) => void;
  
  setSelectedInbox: (inbox: Inbox | null) => void;
  setSelectedUser: (user: User | null) => void;
  setActiveFilter: (filter: string) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  
  // Inbox Operations
  updateInboxStatus: (inboxId: string, status: Inbox['status']) => void;
  addInbox: (inbox: Inbox) => void;
  
  // Message Operations
  addMessage: (message: Message) => void;
  
  // Activity Operations
  addActivity: (activity: Activity) => void;
  
  // Query Type Operations
  addQueryType: (queryType: QueryType) => void;
  
  // Dashboard Stats
  getDashboardStats: () => DashboardStats;
  
  // Socket Event Handlers
  handleInboxUpdated: (inbox: Inbox) => void;
  handleInboxCreated: (inbox: Inbox) => void;
  handleMessageCreated: (message: Message) => void;
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  // Initial Data
  users: mockUsers,
  subscriptions: mockSubscriptions,
  payments: mockPayments,
  inboxes: mockInboxes,
  messages: mockMessages,
  views: mockViews,
  activities: mockActivities,
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
  setActivities: (activities) => set({ activities }),
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
  
  // Activity Operations
  addActivity: (activity) => set((state) => ({
    activities: [...state.activities, activity],
  })),
  
  // Query Type Operations
  addQueryType: (queryType) => set((state) => ({
    queryTypes: [...state.queryTypes, queryType],
  })),
  
  // Dashboard Stats
  getDashboardStats: () => {
    const { inboxes } = get();
    const stats: DashboardStats = {
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
