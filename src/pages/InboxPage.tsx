import { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContextPanel } from '@/components/layout/ContextPanel';
import { Inbox, Message, InboxStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle,
  Mail,
  Send,
  Play,
  Square,
  AlertTriangle,
  Plus,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
];

export default function InboxPage() {
  const {
    inboxes,
    messages,
    selectedInbox,
    setSelectedInbox,
    updateInboxStatus,
    addMessage,
    addActivity,
    queryTypes,
    addQueryType,
    activeFilter,
    setActiveFilter,
  } = useGlobalStore();

  const [showContextPanel, setShowContextPanel] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [activityBody, setActivityBody] = useState('');
  const [activityDueDate, setActivityDueDate] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('');
  const [customQueryType, setCustomQueryType] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter and sort inboxes
  const filteredInboxes = inboxes
    .filter((inbox) => activeFilter === 'all' || inbox.status === activeFilter)
    .sort((a, b) => {
      // Unread first
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      // Then by updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  // Get messages for selected inbox
  const inboxMessages = selectedInbox
    ? messages
        .filter((m) => m.inbox_id === selectedInbox.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inboxMessages]);

  const handleInboxClick = (inbox: Inbox) => {
    setSelectedInbox(inbox);
    setShowContextPanel(true);
    
    // Update status to read if unread
    if (inbox.status === 'unread') {
      updateInboxStatus(inbox.id, 'read');
      toast({
        title: 'Inbox Updated',
        description: 'Marked as read',
      });
    }
  };

  const handleStartConversation = () => {
    if (selectedInbox) {
      updateInboxStatus(selectedInbox.id, 'started');
      toast({
        title: 'Conversation Started',
        description: 'You can now send messages',
      });
    }
  };

  const handleEndConversation = () => {
    setShowQueryModal(true);
  };

  const handleResolve = () => {
    const queryType = customQueryType || selectedQueryType;
    if (selectedInbox && queryType) {
      updateInboxStatus(selectedInbox.id, 'resolved');
      toast({
        title: 'Conversation Resolved',
        description: `Query type: ${queryType}`,
      });
      setShowQueryModal(false);
      setSelectedQueryType('');
      setCustomQueryType('');
    }
  };

  const handleEscalate = () => {
    if (selectedInbox) {
      updateInboxStatus(selectedInbox.id, 'escalated');
      toast({
        title: 'Escalated',
        description: 'This conversation has been escalated',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = () => {
    if (selectedInbox && messageInput.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        from: 'Support',
        to: selectedInbox.user.name,
        body: messageInput,
        source: selectedInbox.source,
        type: 'body',
        messageId: `MSG-${Date.now()}`,
        created_at: new Date().toISOString(),
        inbox_id: selectedInbox.id,
      };
      addMessage(newMessage);
      setMessageInput('');
      toast({
        title: 'Message Sent',
      });
    }
  };

  const handleCreateActivity = () => {
    if (selectedInbox && activityBody && activityDueDate) {
      addActivity({
        id: `act-${Date.now()}`,
        user: selectedInbox.user,
        body: activityBody,
        due_date: activityDueDate,
        created_at: new Date().toISOString(),
      });
      setShowActivityModal(false);
      setActivityBody('');
      setActivityDueDate('');
      toast({
        title: 'Activity Created',
        description: 'New activity has been added',
      });
    }
  };

  const getStatusBadge = (status: InboxStatus) => {
    const variants: Record<InboxStatus, string> = {
      read: 'bg-stat-read/10 text-stat-read border-stat-read/30',
      unread: 'bg-stat-unread/10 text-stat-unread border-stat-unread/30',
      started: 'bg-primary/10 text-primary border-primary/30',
      resolved: 'bg-stat-resolved/10 text-stat-resolved border-stat-resolved/30',
      pending: 'bg-stat-pending/10 text-stat-pending border-stat-pending/30',
      escalated: 'bg-stat-escalated/10 text-stat-escalated border-stat-escalated/30',
    };
    return <Badge variant="outline" className={cn('capitalize', variants[status])}>{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className={cn('flex h-screen', showContextPanel && 'mr-80')}>
        {/* Inbox List */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="text-lg font-semibold">Inbox</h2>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Inbox Items */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredInboxes.map((inbox) => (
                <div
                  key={inbox.id}
                  onClick={() => handleInboxClick(inbox)}
                  className={cn(
                    'inbox-item',
                    selectedInbox?.id === inbox.id && 'inbox-item-active',
                    inbox.status === 'unread' && 'inbox-item-unread'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {inbox.source === 'whatsapp' ? (
                        <MessageCircle className="h-4 w-4 text-whatsapp flex-shrink-0" />
                      ) : (
                        <Mail className="h-4 w-4 text-email flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{inbox.user.name}</span>
                    </div>
                    {getStatusBadge(inbox.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{inbox.preview}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inbox.updated_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
              {filteredInboxes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No conversations found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedInbox ? (
            <>
              {/* Thread Header */}
              <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-semibold text-primary">
                      {selectedInbox.user.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedInbox.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedInbox.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Activity
                  </Button>
                  {selectedInbox.status === 'started' || selectedInbox.status === 'pending' ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEscalate}>
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Escalate
                      </Button>
                      <Button variant="default" size="sm" onClick={handleEndConversation}>
                        <Square className="h-4 w-4 mr-1" />
                        End
                      </Button>
                    </>
                  ) : selectedInbox.status === 'escalated' ? (
                    <Button variant="default" size="sm" onClick={handleEndConversation}>
                      <Square className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  ) : selectedInbox.status !== 'resolved' ? (
                    <Button variant="default" size="sm" onClick={handleStartConversation}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {inboxMessages.map((message) => {
                    const isOutgoing = message.from === 'Support';
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'message-bubble',
                            isOutgoing ? 'message-bubble-outgoing' : 'message-bubble-incoming'
                          )}
                        >
                          {message.subject && (
                            <p className="font-medium text-sm mb-1">{message.subject}</p>
                          )}
                          {message.type === 'template' ? (
                            <p className="text-sm italic">[Template: {message.template}]</p>
                          ) : (
                            <p className="text-sm">{message.body}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 opacity-70">
                            {message.source === 'whatsapp' ? (
                              <MessageCircle className="h-3 w-3" />
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                            <span className="text-xs">
                              {format(new Date(message.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              {(selectedInbox.status === 'started' || selectedInbox.status === 'pending' || selectedInbox.status === 'escalated') && (
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2 max-w-3xl mx-auto">
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Panel */}
      {showContextPanel && (
        <ContextPanel inbox={selectedInbox} onClose={() => setShowContextPanel(false)} />
      )}

      {/* Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Activity description..."
                value={activityBody}
                onChange={(e) => setActivityBody(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={activityDueDate}
                onChange={(e) => setActivityDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateActivity}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Query Type Modal */}
      <Dialog open={showQueryModal} onOpenChange={setShowQueryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Query Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Query Type</label>
              <Select value={selectedQueryType} onValueChange={setSelectedQueryType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a query type" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {queryTypes.map((qt) => (
                    <SelectItem key={qt.id} value={qt.name}>
                      {qt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Or add custom</label>
              <Input
                placeholder="Custom query type..."
                value={customQueryType}
                onChange={(e) => setCustomQueryType(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQueryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
