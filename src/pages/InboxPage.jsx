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
    const colorMap = {
      read: { bgcolor: `${customColors.stat.read}20`, color: customColors.stat.read },
      unread: { bgcolor: `${customColors.stat.unread}20`, color: customColors.stat.unread },
      started: { bgcolor: '#6366f120', color: '#6366f1' },
      resolved: { bgcolor: `${customColors.stat.resolved}20`, color: customColors.stat.resolved },
      pending: { bgcolor: `${customColors.stat.pending}20`, color: customColors.stat.pending },
      escalated: { bgcolor: `${customColors.stat.escalated}20`, color: customColors.stat.escalated },
    };
    const style = colorMap[status] || colorMap.read;
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: style.bgcolor, color: style.color, fontWeight: 500, textTransform: 'capitalize' }}
      />
    );
  };

  const canShowActions = selectedInbox && selectedInbox.status !== 'resolved';
  const isConversationStarted =
    selectedInbox && (selectedInbox.status === 'started' || selectedInbox.status === 'pending' || selectedInbox.status === 'escalated');

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', height: '100vh', mr: showContextPanel ? '320px' : 0 }}>
        {/* Inbox List */}
        <Box sx={{ width: 320, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} mb={1.5}>
              Inbox
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Inbox Items */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {filteredInboxes.map((inbox) => (
              <Box
                key={inbox.id}
                onClick={() => handleInboxClick(inbox)}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: 1,
                  borderColor: selectedInbox?.id === inbox.id ? 'primary.main' : 'divider',
                  bgcolor: inbox.status === 'unread' ? 'primary.light' : 'background.paper',
                  opacity: inbox.status === 'unread' ? 0.1 : 1,
                  '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
                  ...(inbox.status === 'unread' && { bgcolor: '#6366f108' }),
                  ...(selectedInbox?.id === inbox.id && { bgcolor: '#6366f10d' }),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    {inbox.source === 'whatsapp' ? (
                      <ChatIcon fontSize="small" sx={{ color: customColors.channel.whatsapp, flexShrink: 0 }} />
                    ) : (
                      <EmailIcon fontSize="small" sx={{ color: customColors.channel.email, flexShrink: 0 }} />
                    )}
                    <Typography fontWeight={inbox.status === 'unread' ? 600 : 500} noWrap>
                      {inbox.user.name}
                    </Typography>
                  </Box>
                  {getStatusChip(inbox.status)}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1 }}>
                  {inbox.preview}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(inbox.updated_at), 'MMM d, h:mm a')}
                </Typography>
              </Box>
            ))}
            {filteredInboxes.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No conversations found
              </Box>
            )}
          </Box>
        </Box>

        {/* Message Thread */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          {selectedInbox ? (
            <>
              {/* Thread Header */}
              <Box
                sx={{
                  height: 64,
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography fontWeight={600} color="primary.main" variant="body2">
                      {selectedInbox.user.name.split(' ').map((n) => n[0]).join('')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography fontWeight={600}>{selectedInbox.user.name}</Typography>
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
                          <Button variant="outlined" size="small" startIcon={<NoteIcon />} onClick={() => setShowNotesModal(true)}>
                            Create Note
                          </Button>
                          <Button variant="contained" size="small" startIcon={<StopIcon />} onClick={handleEndConversation}>
                            End Conversation
                          </Button>
                          {selectedInbox.status !== 'escalated' && (
                            <Button variant="contained" color="error" size="small" startIcon={<WarningIcon />} onClick={handleEscalate}>
                              Escalate
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button variant="outlined" size="small" startIcon={<NoteIcon />} onClick={() => setShowNotesModal(true)}>
                            Create Note
                          </Button>
                          <Button variant="contained" size="small" startIcon={<PlayArrowIcon />} onClick={handleStartConversation}>
                            Start Conversation
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <IconButton onClick={() => setShowContextPanel(!showContextPanel)} title={showContextPanel ? 'Hide Customer Details' : 'Show Customer Details'}>
                    <PersonIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {inboxMessages.map((message) => {
                    const isOutgoing = message.from === 'Support';
                    return (
                      <Box key={message.id} sx={{ display: 'flex', justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
                        <Box
                          sx={{
                            position: 'relative',
                            maxWidth: '80%',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isOutgoing ? 'primary.main' : 'grey.100',
                            color: isOutgoing ? 'white' : 'text.primary',
                            '&:hover .reply-btn': { opacity: 1 },
                          }}
                        >
                          {message.subject && (
                            <Typography variant="body2" fontWeight={600} mb={0.5}>
                              {message.subject}
                            </Typography>
                          )}
                          {message.type === 'template' ? (
                            <Typography variant="body2" fontStyle="italic">
                              [Template: {message.template}]
                            </Typography>
                          ) : (
                            <Typography variant="body2">{message.body}</Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, opacity: 0.7 }}>
                            {message.source === 'whatsapp' ? <ChatIcon sx={{ fontSize: 12 }} /> : <EmailIcon sx={{ fontSize: 12 }} />}
                            <Typography variant="caption">{format(new Date(message.created_at), 'h:mm a')}</Typography>
                          </Box>
                          {!isOutgoing && (
                            <IconButton
                              className="reply-btn"
                              size="small"
                              sx={{
                                position: 'absolute',
                                right: -40,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                              }}
                              onClick={() => handleReplyClick(message)}
                              disabled={!isConversationStarted}
                              title={!isConversationStarted ? 'Start conversation to reply' : 'Reply'}
                            >
                              <ReplyIcon />
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
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', gap: 1, maxWidth: 720, mx: 'auto' }}>
                  <Button variant="outlined" sx={{ flex: 1 }} startIcon={<EmailIcon sx={{ color: customColors.channel.email }} />} onClick={() => setShowEmailModal(true)}>
                    Send Email
                  </Button>
                  <Button variant="outlined" sx={{ flex: 1 }} startIcon={<ChatIcon sx={{ color: customColors.channel.whatsapp }} />} onClick={() => setShowWhatsappModal(true)}>
                    Send WhatsApp Template
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              <Box sx={{ textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                <Typography>Select a conversation to view messages</Typography>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Description" placeholder="Note description..." multiline rows={3} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} fullWidth />
            <TextField label="Due Date" type="date" value={noteDueDate} onChange={(e) => setNoteDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotesModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateNote}>
            Create Note
          </Button>
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
              {!isWithin24HourWindow(selectedInbox) && <Typography variant="caption" color="text.secondary" ml={1}>(Template required)</Typography>}
            </>
          ) : (
            <>
              <EmailIcon sx={{ color: customColors.channel.email }} />
              Email
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {replyMessage && (
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  Replying to:
                </Typography>
                <Typography variant="body2">{replyMessage.body}</Typography>
              </Box>
            )}
            {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) ? (
              <TextField label="Template Name" placeholder="Enter template name..." value={replyTemplateName} onChange={(e) => setReplyTemplateName(e.target.value)} fullWidth />
            ) : (
              <TextField label="Your Reply" placeholder="Type your reply..." multiline rows={4} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} fullWidth />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendReply}>
            {replyMessage?.source === 'whatsapp' && !isWithin24HourWindow(selectedInbox) ? 'Send Template' : `Send ${replyMessage?.source === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Type Modal */}
      <Dialog open={showQueryModal} onClose={() => setShowQueryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Query Type</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Query Type</InputLabel>
              <Select value={selectedQueryType} onChange={(e) => setSelectedQueryType(e.target.value)} label="Query Type">
                {queryTypes.map((qt) => (
                  <MenuItem key={qt.id} value={qt.name}>
                    {qt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Or add custom" placeholder="Custom query type..." value={customQueryType} onChange={(e) => setCustomQueryType(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQueryModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResolve}>
            Resolve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Modal */}
      <Dialog open={showEmailModal} onClose={() => setShowEmailModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ color: customColors.channel.email }} />
          Send Email
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Subject" placeholder="Email subject..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} fullWidth />
            <TextField label="Message" placeholder="Type your email message..." multiline rows={5} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendEmail}>
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send WhatsApp Template Modal */}
      <Dialog open={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon sx={{ color: customColors.channel.whatsapp }} />
          Send WhatsApp Template
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Template Name" placeholder="Enter template name..." value={whatsappTemplateName} onChange={(e) => setWhatsappTemplateName(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWhatsappModal(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendWhatsapp}>
            Send Template
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
