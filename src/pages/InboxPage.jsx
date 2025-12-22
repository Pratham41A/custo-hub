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
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import ChatIcon from '@mui/icons-material/Chat';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import WarningIcon from '@mui/icons-material/Warning';
import NoteIcon from '@mui/icons-material/Note';
import ReplyIcon from '@mui/icons-material/Reply';
import RefreshIcon from '@mui/icons-material/Refresh';
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
    activeFilter,
    setActiveFilter,
    loading,
    fetchInboxes,
    fetchMessages,
    sendWhatsappTemplate,
    sendWhatsappMessage,
    sendEmailReply,
    sendNewEmail,
    createNote,
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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInboxes();
  }, [activeFilter]);

  const loadInboxes = async () => {
    try {
      await fetchInboxes({ status: activeFilter === 'all' ? '' : activeFilter });
    } catch (error) {
      enqueueSnackbar('Failed to load inboxes', { variant: 'error' });
    }
  };

  const filteredInboxes = inboxes
    .filter((inbox) => activeFilter === 'all' || inbox.status === activeFilter)
    .sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      return new Date(b.updated_at || b.updatedAt).getTime() - new Date(a.updated_at || a.updatedAt).getTime();
    });

  const inboxMessages = messages
    .filter((m) => m.inbox_id === selectedInbox?.id || m.inbox_id === selectedInbox?._id || m.inboxId === selectedInbox?.id)
    .sort((a, b) => new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inboxMessages]);

  const handleInboxClick = async (inbox) => {
    setSelectedInbox(inbox);
    setShowContextPanel(true);
    
    try {
      await fetchMessages(inbox.id || inbox._id);
      if (inbox.status === 'unread') {
        await updateInboxStatus(inbox.id || inbox._id, 'read');
        enqueueSnackbar('Marked as read', { variant: 'info' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to load messages', { variant: 'error' });
    }
  };

  const handleStartConversation = async () => {
    if (selectedInbox) {
      try {
        await updateInboxStatus(selectedInbox.id || selectedInbox._id, 'started');
        enqueueSnackbar('Conversation started', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to start conversation', { variant: 'error' });
      }
    }
  };

  const handleEndConversation = () => {
    setShowQueryModal(true);
  };

  const handleResolve = async () => {
    const queryType = customQueryType || selectedQueryType;
    if (selectedInbox && queryType) {
      try {
        await updateInboxStatus(selectedInbox.id || selectedInbox._id, 'resolved', queryType);
        enqueueSnackbar(`Resolved - Query type: ${queryType}`, { variant: 'success' });
        setShowQueryModal(false);
        setSelectedQueryType('');
        setCustomQueryType('');
      } catch (error) {
        enqueueSnackbar('Failed to resolve conversation', { variant: 'error' });
      }
    }
  };

  const handleEscalate = async () => {
    if (selectedInbox) {
      try {
        await updateInboxStatus(selectedInbox.id || selectedInbox._id, 'escalated');
        enqueueSnackbar('Conversation escalated', { variant: 'warning' });
      } catch (error) {
        enqueueSnackbar('Failed to escalate conversation', { variant: 'error' });
      }
    }
  };

  const handleSendEmail = async () => {
    if (selectedInbox && emailSubject.trim() && emailBody.trim()) {
      setSending(true);
      try {
        await sendNewEmail(emailSubject, emailBody, selectedInbox.user?.email);
        enqueueSnackbar(`Email sent to ${selectedInbox.user?.email}`, { variant: 'success' });
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
        // Refresh messages
        await fetchMessages(selectedInbox.id || selectedInbox._id);
      } catch (error) {
        enqueueSnackbar('Failed to send email', { variant: 'error' });
      } finally {
        setSending(false);
      }
    }
  };

  const handleSendWhatsapp = async () => {
    if (selectedInbox && whatsappTemplateName.trim()) {
      setSending(true);
      try {
        await sendWhatsappTemplate(selectedInbox.user?.mobile, whatsappTemplateName);
        enqueueSnackbar(`WhatsApp template sent to ${selectedInbox.user?.mobile}`, { variant: 'success' });
        setShowWhatsappModal(false);
        setWhatsappTemplateName('');
        await fetchMessages(selectedInbox.id || selectedInbox._id);
      } catch (error) {
        enqueueSnackbar('Failed to send WhatsApp template', { variant: 'error' });
      } finally {
        setSending(false);
      }
    }
  };

  const handleCreateNote = async () => {
    if (selectedInbox && noteBody && noteDueDate) {
      setSending(true);
      try {
        await createNote(selectedInbox.user?.id || selectedInbox.user?._id, noteBody, noteDueDate);
        setShowNotesModal(false);
        setNoteBody('');
        setNoteDueDate('');
        enqueueSnackbar('Note created', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to create note', { variant: 'error' });
      } finally {
        setSending(false);
      }
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

    setSending(true);
    try {
      if (isWhatsApp && !within24Hours) {
        if (!replyTemplateName.trim()) return;
        await sendWhatsappTemplate(selectedInbox.user?.mobile, replyTemplateName);
        enqueueSnackbar('WhatsApp template reply sent', { variant: 'success' });
      } else if (isWhatsApp) {
        if (!replyBody.trim()) return;
        await sendWhatsappMessage(selectedInbox.user?.mobile, replyBody);
        enqueueSnackbar('WhatsApp message sent', { variant: 'success' });
      } else {
        if (!replyBody.trim()) return;
        await sendEmailReply(replyMessage.messageId, replyBody, selectedInbox.user?.email);
        enqueueSnackbar('Email reply sent', { variant: 'success' });
      }
      
      await fetchMessages(selectedInbox.id || selectedInbox._id);
    } catch (error) {
      enqueueSnackbar('Failed to send reply', { variant: 'error' });
    } finally {
      setSending(false);
      setShowReplyModal(false);
      setReplyMessage(null);
      setReplyBody('');
      setReplyTemplateName('');
    }
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

  const getInboxUser = (inbox) => inbox.user || {};
  const getMessageDate = (msg) => msg.created_at || msg.createdAt;

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="h5" fontWeight={700}>
                Inbox
              </Typography>
              <IconButton 
                size="small" 
                onClick={loadInboxes}
                disabled={loading.inboxes}
              >
                {loading.inboxes ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Box>
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
            {loading.inboxes ? (
              [...Array(5)].map((_, i) => (
                <Box key={i} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              filteredInboxes.map((inbox) => {
                const user = getInboxUser(inbox);
                return (
                  <Box
                    key={inbox.id || inbox._id}
                    onClick={() => handleInboxClick(inbox)}
                    className={`inbox-item ${(selectedInbox?.id || selectedInbox?._id) === (inbox.id || inbox._id) ? 'active' : ''}`}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: (selectedInbox?.id || selectedInbox?._id) === (inbox.id || inbox._id) ? 'primary.main' : 'transparent',
                      bgcolor: (selectedInbox?.id || selectedInbox?._id) === (inbox.id || inbox._id) 
                        ? 'rgba(99, 102, 241, 0.06)' 
                        : inbox.status === 'unread' ? 'rgba(245, 158, 11, 0.04)' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        bgcolor: (selectedInbox?.id || selectedInbox?._id) === (inbox.id || inbox._id) 
                          ? 'rgba(99, 102, 241, 0.08)' 
                          : 'rgba(0,0,0,0.02)',
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
                        {(user.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
                              {user.name || 'Unknown User'}
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
                          {inbox.preview || 'No preview available'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {format(new Date(inbox.updated_at || inbox.updatedAt || new Date()), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
            {!loading.inboxes && filteredInboxes.length === 0 && (
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
                    {(getInboxUser(selectedInbox).name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600} fontSize="1rem">
                      {getInboxUser(selectedInbox).name || 'Unknown User'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedInbox.source === 'whatsapp' ? (
                        <ChatIcon sx={{ fontSize: 14, color: customColors.channel.whatsapp }} />
                      ) : (
                        <EmailIcon sx={{ fontSize: 14, color: customColors.channel.email }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {getInboxUser(selectedInbox).email || getInboxUser(selectedInbox).mobile}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {getStatusChip(selectedInbox.status)}
                  {canShowActions && (
                    <>
                      {!isConversationStarted ? (
                        <Button
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={handleStartConversation}
                          size="small"
                          sx={{ bgcolor: 'success.main' }}
                        >
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<StopIcon />}
                            onClick={handleEndConversation}
                            size="small"
                            color="success"
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<WarningIcon />}
                            onClick={handleEscalate}
                            size="small"
                            color="warning"
                          >
                            Escalate
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<NoteIcon />}
                    onClick={() => setShowNotesModal(true)}
                    size="small"
                  >
                    Add Note
                  </Button>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {loading.messages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {inboxMessages.map((message) => {
                      const isOutgoing = message.from === 'Support' || message.direction === 'outbound';
                      return (
                        <Box
                          key={message.id || message._id}
                          className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
                          sx={{
                            maxWidth: '70%',
                            mb: 2,
                            ml: isOutgoing ? 'auto' : 0,
                            p: 2,
                            borderRadius: 3,
                            bgcolor: isOutgoing ? 'primary.main' : 'background.paper',
                            color: isOutgoing ? 'white' : 'text.primary',
                            boxShadow: isOutgoing 
                              ? '0 4px 12px -2px rgba(99, 102, 241, 0.3)' 
                              : '0 2px 8px -2px rgba(0,0,0,0.1)',
                          }}
                        >
                          {message.subject && (
                            <Typography variant="subtitle2" fontWeight={600} mb={1}>
                              {message.subject}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.body || message.text}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ opacity: 0.7 }}
                            >
                              {format(new Date(getMessageDate(message) || new Date()), 'MMM d, h:mm a')}
                            </Typography>
                            {!isOutgoing && isConversationStarted && (
                              <IconButton
                                size="small"
                                onClick={() => handleReplyClick(message)}
                                sx={{ 
                                  color: isOutgoing ? 'white' : 'primary.main',
                                  ml: 1,
                                }}
                              >
                                <ReplyIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Quick Reply Bar */}
              {isConversationStarted && (
                <Box
                  sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    gap: 1.5,
                  }}
                >
                  {selectedInbox.source === 'whatsapp' ? (
                    <Button
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={() => setShowWhatsappModal(true)}
                      sx={{ 
                        bgcolor: customColors.channel.whatsapp,
                        '&:hover': { bgcolor: '#1da851' },
                      }}
                    >
                      Send WhatsApp Template
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<EmailIcon />}
                      onClick={() => setShowEmailModal(true)}
                      sx={{ 
                        bgcolor: customColors.channel.email,
                        '&:hover': { bgcolor: '#2563eb' },
                      }}
                    >
                      Compose Email
                    </Button>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <ChatIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6" fontWeight={500}>
                Select a conversation
              </Typography>
              <Typography variant="body2">
                Choose an inbox item to view the conversation
              </Typography>
            </Box>
          )}
        </Box>

        {/* Context Panel */}
        {showContextPanel && selectedInbox && (
          <ContextPanel 
            inbox={selectedInbox} 
            onClose={() => setShowContextPanel(false)} 
          />
        )}
      </Box>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onClose={() => setShowNotesModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Note</DialogTitle>
        <DialogContent>
          <TextField
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Due Date"
            type="date"
            fullWidth
            value={noteDueDate}
            onChange={(e) => setNoteDueDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotesModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateNote}
            disabled={!noteBody || !noteDueDate || sending}
            startIcon={sending && <CircularProgress size={16} />}
          >
            Create Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Type Modal */}
      <Dialog open={showQueryModal} onClose={() => setShowQueryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Conversation</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Query Type</InputLabel>
            <Select
              value={selectedQueryType}
              onChange={(e) => setSelectedQueryType(e.target.value)}
              label="Query Type"
            >
              <MenuItem value="Technical Issue">Technical Issue</MenuItem>
              <MenuItem value="Billing Query">Billing Query</MenuItem>
              <MenuItem value="General Inquiry">General Inquiry</MenuItem>
              <MenuItem value="Feature Request">Feature Request</MenuItem>
              <MenuItem value="Bug Report">Bug Report</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Or enter custom query type"
            fullWidth
            value={customQueryType}
            onChange={(e) => setCustomQueryType(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQueryModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolve}
            disabled={!selectedQueryType && !customQueryType}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onClose={() => setShowReplyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reply to {replyMessage?.source === 'whatsapp' ? 'WhatsApp' : 'Email'}
        </DialogTitle>
        <DialogContent>
          {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) ? (
            <TextField
              label="Template Name"
              fullWidth
              value={replyTemplateName}
              onChange={(e) => setReplyTemplateName(e.target.value)}
              placeholder="e.g., t1, welcome_template"
              helperText="24-hour window expired. You can only send templates."
              sx={{ mt: 2 }}
            />
          ) : (
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendReply}
            disabled={sending}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onClose={() => setShowEmailModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compose Email</DialogTitle>
        <DialogContent>
          <TextField
            label="Subject"
            fullWidth
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Body"
            fullWidth
            multiline
            rows={6}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendEmail}
            disabled={!emailSubject || !emailBody || sending}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send WhatsApp Template</DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            fullWidth
            value={whatsappTemplateName}
            onChange={(e) => setWhatsappTemplateName(e.target.value)}
            placeholder="e.g., t1, welcome_template"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWhatsappModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendWhatsapp}
            disabled={!whatsappTemplateName || sending}
            sx={{ 
              bgcolor: customColors.channel.whatsapp,
              '&:hover': { bgcolor: '#1da851' },
            }}
          >
            Send Template
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
