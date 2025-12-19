import { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContextPanel } from '@/components/layout/ContextPanel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import ChatIcon from '@mui/icons-material/Chat';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import WarningIcon from '@mui/icons-material/Warning';
import NoteIcon from '@mui/icons-material/Note';
import ReplyIcon from '@mui/icons-material/Reply';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { customColors } from '@/theme/theme';

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
    addMessage,
    addNote,
    queryTypes,
    activeFilter,
    setActiveFilter,
  } = useGlobalStore();

  const { enqueueSnackbar } = useSnackbar();

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

  const filteredInboxes = inboxes
    .filter((inbox) => activeFilter === 'all' || inbox.status === activeFilter)
    .sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const inboxMessages = selectedInbox
    ? messages
        .filter((m) => m.inbox_id === selectedInbox.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inboxMessages]);

  const handleInboxClick = (inbox) => {
    setSelectedInbox(inbox);
    setShowContextPanel(true);
    if (inbox.status === 'unread') {
      updateInboxStatus(inbox.id, 'read');
      enqueueSnackbar('Marked as read', { variant: 'info' });
    }
  };

  const handleStartConversation = () => {
    if (selectedInbox) {
      updateInboxStatus(selectedInbox.id, 'started');
      enqueueSnackbar('Conversation started', { variant: 'success' });
    }
  };

  const handleEndConversation = () => {
    setShowQueryModal(true);
  };

  const handleResolve = () => {
    const queryType = customQueryType || selectedQueryType;
    if (selectedInbox && queryType) {
      updateInboxStatus(selectedInbox.id, 'resolved');
      enqueueSnackbar(`Resolved - Query type: ${queryType}`, { variant: 'success' });
      setShowQueryModal(false);
      setSelectedQueryType('');
      setCustomQueryType('');
    }
  };

  const handleEscalate = () => {
    if (selectedInbox) {
      updateInboxStatus(selectedInbox.id, 'escalated');
      enqueueSnackbar('Conversation escalated', { variant: 'warning' });
    }
  };

  const handleSendEmail = async () => {
    if (selectedInbox && emailSubject.trim() && emailBody.trim()) {
      enqueueSnackbar('Sending email...', { variant: 'info' });
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      enqueueSnackbar(`Email sent to ${selectedInbox.user.email}`, { variant: 'success' });
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
    }
  };

  const handleSendWhatsapp = async () => {
    if (selectedInbox && whatsappTemplateName.trim()) {
      enqueueSnackbar('Sending WhatsApp template...', { variant: 'info' });
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      enqueueSnackbar(`WhatsApp template sent to ${selectedInbox.user.mobile}`, { variant: 'success' });
      setShowWhatsappModal(false);
      setWhatsappTemplateName('');
    }
  };

  const handleCreateNote = async () => {
    if (selectedInbox && noteBody && noteDueDate) {
      enqueueSnackbar('Creating note...', { variant: 'info' });
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      enqueueSnackbar('Note created', { variant: 'success' });
    }
  };

  const handleReplyClick = (message) => {
    setReplyMessage(message);
    setReplyBody('');
    setReplyTemplateName('');
    setShowReplyModal(true);
  };

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

    if (isWhatsApp && !within24Hours) {
      if (!replyTemplateName.trim()) return;

      enqueueSnackbar('Sending WhatsApp template...', { variant: 'info' });
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      enqueueSnackbar('WhatsApp template reply sent', { variant: 'success' });
    } else {
      if (!replyBody.trim()) return;

      enqueueSnackbar(isWhatsApp ? 'Sending WhatsApp message...' : 'Sending email...', { variant: 'info' });
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      enqueueSnackbar(isWhatsApp ? 'WhatsApp message sent' : 'Email sent', { variant: 'success' });
    }

    setShowReplyModal(false);
    setReplyMessage(null);
    setReplyBody('');
    setReplyTemplateName('');
  };

  const getStatusChip = (status) => {
    const styles = {
      read: { bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      unread: { bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
      started: { bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' },
      resolved: { bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
      pending: { bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
      escalated: { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
    };
    const style = styles[status] || styles.read;
    return (
      <Chip
        label={status}
        size="small"
        sx={{ 
          ...style, 
          fontWeight: 600, 
          textTransform: 'capitalize',
          fontSize: '0.7rem',
          height: 22,
        }}
      />
    );
  };

  const canShowActions = selectedInbox && selectedInbox.status !== 'resolved';
  const isConversationStarted =
    selectedInbox && (selectedInbox.status === 'started' || selectedInbox.status === 'pending' || selectedInbox.status === 'escalated');

  return (
    <MainLayout>
      <Box 
        sx={{ 
          display: 'flex', 
          height: '100vh', 
          mr: showContextPanel ? '340px' : 0,
          transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Inbox List */}
        <Box 
          sx={{ 
            width: 360, 
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '4px 0 24px -12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header & Filters */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Inbox
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {filteredInboxes.length} conversations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? 'contained' : 'text'}
                  size="small"
                  onClick={() => setActiveFilter(filter.value)}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    bgcolor: activeFilter === filter.value ? undefined : 'rgba(0,0,0,0.04)',
                    '&:hover': {
                      bgcolor: activeFilter === filter.value ? undefined : 'rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Inbox Items */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            {filteredInboxes.map((inbox) => (
              <Box
                key={inbox.id}
                onClick={() => handleInboxClick(inbox)}
                className={`inbox-item ${selectedInbox?.id === inbox.id ? 'active' : ''}`}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedInbox?.id === inbox.id ? 'primary.main' : 'transparent',
                  bgcolor: selectedInbox?.id === inbox.id ? 'rgba(99, 102, 241, 0.06)' : inbox.status === 'unread' ? 'rgba(245, 158, 11, 0.04)' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: selectedInbox?.id === inbox.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.02)',
                    boxShadow: '0 4px 12px -4px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Avatar
                    sx={{ 
                      width: 44, 
                      height: 44, 
                      bgcolor: inbox.source === 'whatsapp' ? `${customColors.channel.whatsapp}20` : `${customColors.channel.email}20`,
                      color: inbox.source === 'whatsapp' ? customColors.channel.whatsapp : customColors.channel.email,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    {inbox.user.name.split(' ').map((n) => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {inbox.source === 'whatsapp' ? (
                          <ChatIcon sx={{ fontSize: 14, color: customColors.channel.whatsapp }} />
                        ) : (
                          <EmailIcon sx={{ fontSize: 14, color: customColors.channel.email }} />
                        )}
                        <Typography 
                          fontWeight={inbox.status === 'unread' ? 700 : 600} 
                          noWrap
                          sx={{ fontSize: '0.9rem' }}
                        >
                          {inbox.user.name}
                        </Typography>
                      </Box>
                      {getStatusChip(inbox.status)}
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        lineHeight: 1.5,
                        mb: 1,
                      }}
                    >
                      {inbox.preview}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {format(new Date(inbox.updated_at), 'MMM d, h:mm a')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            {filteredInboxes.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <ChatIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography>No conversations found</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Message Thread */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc' }}>
          {selectedInbox ? (
            <>
              {/* Thread Header */}
              <Box
                sx={{
                  height: 'var(--header-height, 72px)',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      background: customColors.gradients.primary,
                      fontWeight: 600,
                    }}
                  >
                    {selectedInbox.user.name.split(' ').map((n) => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600} fontSize="1rem">
                      {selectedInbox.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInbox.user.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {canShowActions && (
                    <>
                      {isConversationStarted ? (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<NoteIcon />} 
                            onClick={() => setShowNotesModal(true)}
                            sx={{ borderRadius: 2 }}
                          >
                            Note
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<StopIcon />} 
                            onClick={handleEndConversation}
                            sx={{ borderRadius: 2 }}
                          >
                            End
                          </Button>
                          {selectedInbox.status !== 'escalated' && (
                            <Button 
                              variant="contained" 
                              color="error" 
                              size="small" 
                              startIcon={<WarningIcon />} 
                              onClick={handleEscalate}
                              sx={{ borderRadius: 2 }}
                            >
                              Escalate
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<NoteIcon />} 
                            onClick={() => setShowNotesModal(true)}
                            sx={{ borderRadius: 2 }}
                          >
                            Note
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<PlayArrowIcon />} 
                            onClick={handleStartConversation}
                            sx={{ borderRadius: 2 }}
                          >
                            Start
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <IconButton 
                    onClick={() => setShowContextPanel(!showContextPanel)} 
                    sx={{ 
                      ml: 1,
                      bgcolor: showContextPanel ? 'primary.main' : 'transparent',
                      color: showContextPanel ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: showContextPanel ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    <PersonIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
                <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {inboxMessages.map((message) => {
                    const isOutgoing = message.from === 'Support';
                    return (
                      <Box 
                        key={message.id} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Box
                          className={`message-bubble ${isOutgoing ? 'message-bubble-outgoing' : 'message-bubble-incoming'}`}
                          sx={{
                            position: 'relative',
                            maxWidth: '75%',
                            p: 2,
                            px: 2.5,
                            borderRadius: 3,
                            background: isOutgoing 
                              ? customColors.gradients.primary
                              : 'white',
                            color: isOutgoing ? 'white' : 'text.primary',
                            boxShadow: isOutgoing 
                              ? '0 4px 14px -4px rgba(99, 102, 241, 0.4)'
                              : '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
                            border: isOutgoing ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            '&:hover .reply-btn': { opacity: 1 },
                          }}
                        >
                          {message.subject && (
                            <Typography variant="body2" fontWeight={600} mb={0.5}>
                              {message.subject}
                            </Typography>
                          )}
                          {message.type === 'template' ? (
                            <Typography variant="body2" fontStyle="italic" sx={{ opacity: 0.9 }}>
                              [Template: {message.template}]
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                              {message.body}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, opacity: 0.7 }}>
                            {message.source === 'whatsapp' ? (
                              <ChatIcon sx={{ fontSize: 12 }} />
                            ) : (
                              <EmailIcon sx={{ fontSize: 12 }} />
                            )}
                            <Typography variant="caption">
                              {format(new Date(message.created_at), 'h:mm a')}
                            </Typography>
                          </Box>
                          {!isOutgoing && (
                            <IconButton
                              className="reply-btn"
                              size="small"
                              sx={{
                                position: 'absolute',
                                right: -44,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0,
                                transition: 'all 0.2s',
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { bgcolor: 'primary.light', color: 'white' },
                              }}
                              onClick={() => handleReplyClick(message)}
                              disabled={!isConversationStarted}
                            >
                              <ReplyIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>
              </Box>

              {/* Send Actions */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', gap: 1.5, maxWidth: 720, mx: 'auto' }}>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      flex: 1, 
                      py: 1.5,
                      borderRadius: 3,
                      borderWidth: 1.5,
                    }} 
                    startIcon={<EmailIcon sx={{ color: customColors.channel.email }} />} 
                    onClick={() => setShowEmailModal(true)}
                  >
                    Send Email
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      flex: 1, 
                      py: 1.5,
                      borderRadius: 3,
                      borderWidth: 1.5,
                    }} 
                    startIcon={<ChatIcon sx={{ color: customColors.channel.whatsapp }} />} 
                    onClick={() => setShowWhatsappModal(true)}
                  >
                    Send WhatsApp
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 4,
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  Select a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a conversation from the list to view messages
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Context Panel */}
      {showContextPanel && <ContextPanel inbox={selectedInbox} onClose={() => setShowContextPanel(false)} />}

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onClose={() => setShowNotesModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Note</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Description" 
              placeholder="Note description..." 
              multiline 
              rows={3} 
              value={noteBody} 
              onChange={(e) => setNoteBody(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Due Date" 
              type="date" 
              value={noteDueDate} 
              onChange={(e) => setNoteDueDate(e.target.value)} 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotesModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateNote}>Create Note</Button>
        </DialogActions>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onClose={() => setShowReplyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Reply via{' '}
          {replyMessage?.source === 'whatsapp' ? (
            <>
              <ChatIcon sx={{ color: customColors.channel.whatsapp }} />
              WhatsApp
              {!isWithin24HourWindow(selectedInbox) && (
                <Typography variant="caption" color="text.secondary" ml={1}>(Template required)</Typography>
              )}
            </>
          ) : (
            <>
              <EmailIcon sx={{ color: customColors.channel.email }} />
              Email
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {replyMessage && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Replying to:
                </Typography>
                <Typography variant="body2">{replyMessage.body}</Typography>
              </Box>
            )}
            {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) ? (
              <TextField 
                label="Template Name" 
                placeholder="Enter template name..." 
                value={replyTemplateName} 
                onChange={(e) => setReplyTemplateName(e.target.value)} 
                fullWidth 
              />
            ) : (
              <TextField 
                label="Your Reply" 
                placeholder="Type your reply..." 
                multiline 
                rows={4} 
                value={replyBody} 
                onChange={(e) => setReplyBody(e.target.value)} 
                fullWidth 
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendReply}>
            {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) 
              ? 'Send Template' 
              : `Send ${replyMessage?.source === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Type Modal */}
      <Dialog open={showQueryModal} onClose={() => setShowQueryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Query Type</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Query Type</InputLabel>
              <Select value={selectedQueryType} onChange={(e) => setSelectedQueryType(e.target.value)} label="Query Type">
                {queryTypes.map((qt) => (
                  <MenuItem key={qt.id} value={qt.name}>{qt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Or add custom" 
              placeholder="Custom query type..." 
              value={customQueryType} 
              onChange={(e) => setCustomQueryType(e.target.value)} 
              fullWidth 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQueryModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResolve}>Resolve</Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Modal */}
      <Dialog open={showEmailModal} onClose={() => setShowEmailModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ color: customColors.channel.email }} />
          Send Email
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Subject" 
              placeholder="Email subject..." 
              value={emailSubject} 
              onChange={(e) => setEmailSubject(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Message" 
              placeholder="Type your email message..." 
              multiline 
              rows={5} 
              value={emailBody} 
              onChange={(e) => setEmailBody(e.target.value)} 
              fullWidth 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendEmail}>Send Email</Button>
        </DialogActions>
      </Dialog>

      {/* Send WhatsApp Template Modal */}
      <Dialog open={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon sx={{ color: customColors.channel.whatsapp }} />
          Send WhatsApp Template
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Template Name" 
              placeholder="Enter template name..." 
              value={whatsappTemplateName} 
              onChange={(e) => setWhatsappTemplateName(e.target.value)} 
              fullWidth 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWhatsappModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendWhatsapp}>Send Template</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
