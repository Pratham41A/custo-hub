import { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContextPanel } from '@/components/layout/ContextPanel';
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
  StickyNote,
  Reply,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const statusFilters = [
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
    updateInboxSource,
    addMessage,
    addNote,
    queryTypes,
    addQueryType,
    activeFilter,
    setActiveFilter,
  } = useGlobalStore();

  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyTemplateName, setReplyTemplateName] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteDueDate, setNoteDueDate] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('');
  const [customQueryType, setCustomQueryType] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappTemplateName, setWhatsappTemplateName] = useState('');
  const messagesEndRef = useRef(null);

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

  const handleInboxClick = (inbox) => {
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

  const handleSendEmail = async () => {
    if (selectedInbox && emailSubject.trim() && emailBody.trim()) {
      toast({
        title: 'Sending Email...',
        description: 'Calling Outlook Email API',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMessage = {
        id: `msg-${Date.now()}`,
        from: 'Support',
        to: selectedInbox.user.name,
        subject: emailSubject,
        body: emailBody,
        source: 'email',
        type: 'body',
        messageId: `MSG-${Date.now()}`,
        created_at: new Date().toISOString(),
        inbox_id: selectedInbox.id,
      };
      addMessage(newMessage);
      
      toast({
        title: 'Email Sent',
        description: `Email sent to ${selectedInbox.user.email}`,
      });
      
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
    }
  };

  const handleSendWhatsapp = async () => {
    if (selectedInbox && whatsappTemplateName.trim()) {
      toast({
        title: 'Sending WhatsApp Template...',
        description: 'Calling WhatsApp API',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMessage = {
        id: `msg-${Date.now()}`,
        from: 'Support',
        to: selectedInbox.user.name,
        body: `Template: ${whatsappTemplateName}`,
        source: 'whatsapp',
        type: 'template',
        template: whatsappTemplateName,
        messageId: `MSG-${Date.now()}`,
        created_at: new Date().toISOString(),
        inbox_id: selectedInbox.id,
      };
      addMessage(newMessage);
      
      toast({
        title: 'WhatsApp Template Sent',
        description: `Template "${whatsappTemplateName}" sent to ${selectedInbox.user.mobile}`,
      });
      
      setShowWhatsappModal(false);
      setWhatsappTemplateName('');
    }
  };

  const handleCreateNote = async () => {
    if (selectedInbox && noteBody && noteDueDate) {
      toast({
        title: 'Creating Note...',
        description: 'Saving to database',
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addNote({
        id: `note-${Date.now()}`,
        user: selectedInbox.user,
        body: noteBody,
        due_date: noteDueDate,
        created_at: new Date().toISOString(),
      });
      setShowNotesModal(false);
      setNoteBody('');
      setNoteDueDate('');
      toast({
        title: 'Note Created',
        description: 'New note has been added',
      });
    }
  };

  const handleReplyClick = (message) => {
    setReplyMessage(message);
    setReplyBody('');
    setReplyTemplateName('');
    setShowReplyModal(true);
  };

  // Check if WhatsApp 24-hour window is active
  const isWithin24HourWindow = (inbox) => {
    if (!inbox || !inbox.whatsapp24HourWindowStartDateTime) return false;
    const windowStart = new Date(inbox.whatsapp24HourWindowStartDateTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const handleSendReply = async () => {
    if (!selectedInbox || !replyMessage) return;

    const isWhatsApp = replyMessage.source === 'whatsapp';
    const within24Hours = isWithin24HourWindow(selectedInbox);

    // For WhatsApp outside 24-hour window, require template name
    if (isWhatsApp && !within24Hours) {
      if (!replyTemplateName.trim()) return;
      
      toast({
        title: 'Sending WhatsApp Template...',
        description: 'Calling WhatsApp API',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMessage = {
        id: `msg-${Date.now()}`,
        from: 'Support',
        to: selectedInbox.user.name,
        body: `Template: ${replyTemplateName}`,
        source: 'whatsapp',
        type: 'template',
        template: replyTemplateName,
        messageId: `MSG-${Date.now()}`,
        created_at: new Date().toISOString(),
        inbox_id: selectedInbox.id,
        inReplyTo: replyMessage.messageId,
      };
      addMessage(newMessage);

      toast({
        title: 'WhatsApp Template Sent',
        description: `Template reply sent to ${selectedInbox.user.name}`,
      });
    } else {
      // For email or WhatsApp within 24-hour window, require body
      if (!replyBody.trim()) return;

      if (isWhatsApp) {
        toast({
          title: 'Sending WhatsApp Message...',
          description: 'Calling WhatsApp API',
        });
      } else {
        toast({
          title: 'Sending Email...',
          description: 'Calling Outlook Email API',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMessage = {
        id: `msg-${Date.now()}`,
        from: 'Support',
        to: selectedInbox.user.name,
        body: replyBody,
        source: replyMessage.source,
        type: 'body',
        messageId: `MSG-${Date.now()}`,
        created_at: new Date().toISOString(),
        inbox_id: selectedInbox.id,
        inReplyTo: replyMessage.messageId,
      };
      addMessage(newMessage);
      
      toast({
        title: isWhatsApp ? 'WhatsApp Message Sent' : 'Email Sent',
        description: `Reply sent to ${selectedInbox.user.name}`,
      });
    }
    
    setShowReplyModal(false);
    setReplyMessage(null);
    setReplyBody('');
    setReplyTemplateName('');
  };

  const getStatusBadge = (status) => {
    const variants = {
      read: 'bg-stat-read/10 text-stat-read border-stat-read/30',
      unread: 'bg-stat-unread/10 text-stat-unread border-stat-unread/30',
      started: 'bg-primary/10 text-primary border-primary/30',
      resolved: 'bg-stat-resolved/10 text-stat-resolved border-stat-resolved/30',
      pending: 'bg-stat-pending/10 text-stat-pending border-stat-pending/30',
      escalated: 'bg-stat-escalated/10 text-stat-escalated border-stat-escalated/30',
    };
    return <Badge variant="outline" className={cn('capitalize', variants[status])}>{status}</Badge>;
  };

  const canShowActions = selectedInbox && selectedInbox.status !== 'resolved';
  const isConversationStarted = selectedInbox && (selectedInbox.status === 'started' || selectedInbox.status === 'pending' || selectedInbox.status === 'escalated');

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
              {/* Thread Header with Top Action Buttons */}
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
                  {canShowActions && (
                    <>
                      {isConversationStarted ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setShowNotesModal(true)}>
                            <StickyNote className="h-4 w-4 mr-1" />
                            Create Note
                          </Button>
                          <Button variant="default" size="sm" onClick={handleEndConversation}>
                            <Square className="h-4 w-4 mr-1" />
                            End Conversation
                          </Button>
                          {selectedInbox.status !== 'escalated' && (
                            <Button variant="destructive" size="sm" onClick={handleEscalate}>
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setShowNotesModal(true)}>
                            <StickyNote className="h-4 w-4 mr-1" />
                            Create Note
                          </Button>
                          <Button variant="default" size="sm" onClick={handleStartConversation}>
                            <Play className="h-4 w-4 mr-1" />
                            Start Conversation
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowContextPanel(!showContextPanel)}
                    className="ml-2"
                    title={showContextPanel ? 'Hide Customer Details' : 'Show Customer Details'}
                  >
                    <User className="h-5 w-5" />
                  </Button>
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
                            'message-bubble relative group',
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
                          {/* Reply Button - only for incoming messages, disabled if conversation not started */}
                          {!isOutgoing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={() => handleReplyClick(message)}
                              disabled={!isConversationStarted}
                              title={!isConversationStarted ? 'Start conversation to reply' : 'Reply'}
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Send Email / WhatsApp Buttons - Static */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowEmailModal(true)}
                  >
                    <Mail className="h-4 w-4 mr-2 text-email" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowWhatsappModal(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-whatsapp" />
                    Send WhatsApp Template
                  </Button>
                </div>
              </div>
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

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Note description..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={noteDueDate}
                onChange={(e) => setNoteDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>Create Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Reply via {replyMessage?.source === 'whatsapp' ? (
                <>
                  <MessageCircle className="h-5 w-5 text-whatsapp" />
                  WhatsApp
                  {!isWithin24HourWindow(selectedInbox) && (
                    <span className="text-xs text-muted-foreground ml-2">(Template required - outside 24h window)</span>
                  )}
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 text-email" />
                  Email
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {replyMessage && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-muted-foreground mb-1">Replying to:</p>
                <p>{replyMessage.body}</p>
              </div>
            )}
            {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) ? (
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  placeholder="Enter template name..."
                  value={replyTemplateName}
                  onChange={(e) => setReplyTemplateName(e.target.value)}
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply}>
              <Send className="h-4 w-4 mr-2" />
              {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) 
                ? 'Send Template' 
                : `Send ${replyMessage?.source === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
            </Button>
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

      {/* Send Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-email" />
              Send Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your email message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="mt-1"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send WhatsApp Template Modal */}
      <Dialog open={showWhatsappModal} onOpenChange={setShowWhatsappModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-whatsapp" />
              Send WhatsApp Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="Enter template name..."
                value={whatsappTemplateName}
                onChange={(e) => setWhatsappTemplateName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWhatsappModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendWhatsapp}>
              <Send className="h-4 w-4 mr-2" />
              Send Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
