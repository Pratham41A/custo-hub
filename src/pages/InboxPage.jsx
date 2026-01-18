import { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '../store/globalStore';
import { MainLayout } from '../components/layout/MainLayout';
import { ContextPanel } from '../components/layout/ContextPanel';
import { EmailEditor } from '../components/EmailEditor';

const formatDate = (date) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime()) || parsed.getFullYear() < 2020) {
    return date;
  }
  return parsed.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
};

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'started', label: 'Started' },
  { value: 'resolved', label: 'Resolved' },
];

export default function InboxPage() {
  const {
    inboxes, messages, selectedInbox, setSelectedInbox, updateInboxStatus,
    activeFilter, setActiveFilter, loading, fetchInboxes, fetchMessages,
    sendWhatsappTemplate, sendWhatsappMessage, sendEmailReply, sendNewEmail, createNote,
    queryTypes, fetchQueryTypes,
  } = useGlobalStore();

  const [showContextPanel, setShowContextPanel] = useState(false);
  const [modal, setModal] = useState({ type: null, data: {} });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ text: '', type: '' });
  const [sending, setSending] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyForm, setReplyForm] = useState({ body: '', template: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => { loadInboxes(); }, [activeFilter]);
  useEffect(() => { fetchQueryTypes(); }, []);

  const loadInboxes = async () => {
    try {
      await fetchInboxes({ status: activeFilter === 'all' ? '' : activeFilter });
    } catch {
      showToast('Failed to load inboxes', 'error');
    }
  };

  const showToast = (text, type) => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3000);
  };

  const closeModal = () => setModal({ type: null, data: {} });

  // Robust date parser: handles numeric timestamps, ISO strings only
  // Returns 0 for human-readable strings (e.g., "Jan 2, 6:03 AM") without explicit year,
  // so getItemTimestamp can infer the year from createdAt
  const parseDate = (d) => {
    if (d === null || d === undefined || d === '') return 0;
    if (typeof d === 'number') return d;
    const asNumber = Number(d);
    if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) return asNumber;
    // Only parse ISO strings or strings that contain a 4-digit year
    if (typeof d === 'string') {
      // ISO format: contains 'T' or 'Z'
      if (d.includes('T') || d.includes('Z')) {
        const t = Date.parse(d);
        if (Number.isFinite(t)) return t;
      }
      // Check if string contains a 4-digit year
      if (d.match(/\d{4}/)) {
        const t = Date.parse(d);
        if (Number.isFinite(t)) return t;
      }
    }
    // For human-readable strings without explicit year, return 0
    return 0;
  };

  const statusOrder = { unread: 0, read: 1, started: 2, resolved: 3 };

  // Determine a reliable timestamp for an inbox item using updatedAt, falling back to createdAt
  const getItemTimestamp = (item) => {
    if (!item) return 0;
    const updated = item.updatedAt;
    const created = item.createdAt;
    // Try parsing updatedAt directly
    let t = parseDate(updated);
    if (t) {
      console.log(`[parseDate direct] ${item.owner?.fullname || item.owner?.name || 'Unknown'} | updatedAt="${updated}" | timestamp=${t} (${new Date(t).toISOString()})`);
      return t;
    }
    // If updatedAt is a human string without year, infer year from createdAt
    if (typeof updated === 'string' && updated.trim() !== '' && created) {
      try {
        const createdDate = new Date(created);
        const createdYear = createdDate.getFullYear();
        // Try with createdAt's year first
        let withYear = Date.parse(`${updated} ${createdYear}`);
        if (Number.isFinite(withYear)) {
          const parsedDate = new Date(withYear);
          // If parsed date is before createdAt, it likely belongs to the next year
          if (parsedDate < createdDate) {
            withYear = Date.parse(`${updated} ${createdYear + 1}`);
            if (Number.isFinite(withYear)) {
              console.log(`[year bumped] ${item.owner?.fullname || item.owner?.name || 'Unknown'} | updatedAt="${updated}" | createdAt="${created}" | timestamp=${withYear} (${new Date(withYear).toISOString()})`);
              return withYear;
            }
          }
          console.log(`[year inferred] ${item.owner?.fullname || item.owner?.name || 'Unknown'} | updatedAt="${updated}" | createdAt="${created}" | timestamp=${withYear} (${new Date(withYear).toISOString()})`);
          return withYear;
        }
      } catch (e) {
        console.log(`[error parsing]`, e);
      }
    }
    // Fallback to createdAt
    const fallback = parseDate(created);
    console.log(`[fallback] ${item.owner?.fullname || item.owner?.name || 'Unknown'} | createdAt="${created}" | timestamp=${fallback} (${new Date(fallback).toISOString()})`);
    return fallback;
  };

  const allowedStatuses = Object.keys(statusOrder);

  const filteredInboxes = inboxes
    .filter((i) => {
      // When 'all' is selected, only show the allowed statuses in the defined order
      if (activeFilter === 'all') return allowedStatuses.includes(i.status);
      // When a specific status is selected, show only that status
      return i.status === activeFilter;
    })
    .filter((i) => {
      if (!search) return true;
      const fullname = (i.owner?.fullname || i.owner?.name || '').toLowerCase();
      return fullname.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 999;
      const orderB = statusOrder[b.status] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      // Within the same status group, sort by a reliable timestamp descending (latest first)
      const aTime = getItemTimestamp(a);
      const bTime = getItemTimestamp(b);
      const diff = bTime - aTime;
      console.log(`[sort] ${b.owner?.fullname || b.owner?.name || 'Unknown'} (${bTime}) vs ${a.owner?.fullname || a.owner?.name || 'Unknown'} (${aTime}) → diff=${diff}`);
      return diff;
    });

  const inboxMessages = messages
    .filter((m) => m.inboxId === selectedInbox?._id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inboxMessages]);

  const handleInboxClick = async (inbox) => {
    setSelectedInbox(inbox);
    setShowContextPanel(true);
    try {
      await fetchMessages(inbox._id);
      if (inbox.status === 'unread') {
        await updateInboxStatus(inbox._id, 'read');
        showToast('Marked as read', 'info');
      }
    } catch {
      showToast('Failed to load messages', 'error');
    }
  };

  const handleStart = async () => {
    if (!selectedInbox) return;
    try {
      await updateInboxStatus(selectedInbox._id, 'started');
      showToast('Conversation started', 'success');
    } catch { showToast('Failed to start', 'error'); }
  };

  const handleResolve = async () => {
    const queryType = modal.data.customQuery || modal.data.queryType;
    if (!selectedInbox || !queryType) return;
    try {
      await updateInboxStatus(selectedInbox._id, 'resolved', queryType);
      showToast(`Resolved - ${queryType}`, 'success');
      closeModal();
    } catch { showToast('Failed to resolve', 'error'); }
  };

  const handleSendEmail = async () => {
    if (!selectedInbox || !modal.data.subject || !modal.data.body) return;
    const email = modal.data.email_address || selectedInbox.owner?.email;
    if (!email) {
      showToast('Email address not found', 'error');
      return;
    }
    setSending(true);
    try {
      await sendNewEmail(modal.data.subject, modal.data.body, email);
      showToast('Email sent', 'success');
      closeModal();
      await fetchMessages(selectedInbox._id);
    } catch { showToast('Failed to send email', 'error'); }
    finally { setSending(false); }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedInbox || !modal.data.template_name) return;
    const mobile = modal.data.mobile_number || selectedInbox.owner?.mobile;
    console.log('WhatsApp Send Debug:', { selectedInbox, mobile, template: modal.data.template_name });
    if (!mobile) {
      showToast('Mobile number not found', 'error');
      return;
    }
    setSending(true);
    try {
      console.log('Sending WhatsApp with:', { mobile, template: modal.data.template_name });
      await sendWhatsappTemplate(mobile, modal.data.template_name);
      showToast('WhatsApp template sent', 'success');
      closeModal();
      await fetchMessages(selectedInbox._id);
    } catch (error) {
      console.error('WhatsApp send error:', error);
      showToast('Failed to send WhatsApp', 'error');
    }
    finally { setSending(false); }
  };

  const handleReply = async () => {
    if (!selectedInbox) return;
    setSending(true);
    try {
      const msg = modal.data.replyMessage;
      const isWhatsApp = msg?.source === 'whatsapp';
      console.log('Reply Debug:', { isWhatsApp, msg, owner: selectedInbox.owner, ownerKeys: Object.keys(selectedInbox.owner || {}) });
      if (isWhatsApp && modal.data.template) {
        const mobile = selectedInbox.owner?.mobile;
        console.log('Owner object properties:', selectedInbox.owner);
        console.log('Sending WhatsApp template reply:', { mobile, template: modal.data.template });
        if (!mobile) throw new Error('Mobile number not found');
        await sendWhatsappTemplate(mobile, modal.data.template);
      } else if (isWhatsApp && modal.data.body) {
        const mobile = selectedInbox.owner?.mobile;
        console.log('Sending WhatsApp message reply:', { mobile, body: modal.data.body });
        if (!mobile) throw new Error('Mobile number not found');
        await sendWhatsappMessage(mobile, modal.data.body);
      } else if (modal.data.body) {
        const email = selectedInbox.owner?.email;
        console.log('Sending email reply:', { messageId: msg?.messageId, email });
        if (!email) throw new Error('Email not found');
        await sendEmailReply(msg?.messageId, modal.data.body, email);
      }
      showToast('Reply sent', 'success');
      closeModal();
      await fetchMessages(selectedInbox._id);
    } catch (error) {
      console.error('Reply send error:', error);
      showToast('Failed to send reply', 'error');
    }
    finally { setSending(false); }
  };

  const handleInlineReply = async (message, isSendingEmail = false) => {
    if (!selectedInbox || !replyForm.body) return;
    setSending(true);
    try {
      const isWhatsApp = message?.source === 'whatsapp';
      const isWeb = message?.source === 'web';
      
      if (isWeb) {
        // Send Web Reply - emit socket event
        const socketService = (await import('../services/socketService')).socketService;
        if (socketService.isSocketConnected()) {
          socketService.socket.emit('agent_message', {
            inbox: selectedInbox._id,
            body: replyForm.body,
          });
          console.log('Web message reply sent via socket:', { inbox: selectedInbox._id, body: replyForm.body });
        } else {
          throw new Error('Socket connection not available');
        }
      } else if (isSendingEmail || !isWhatsApp) {
        // Send Email Reply
        const email = selectedInbox.owner?.email;
        if (!email) throw new Error('Email not found');
        await sendEmailReply(message?.messageId, replyForm.body, email);
      } else {
        // Send WhatsApp Reply
        const mobile = selectedInbox.owner?.mobile;
        if (!mobile) throw new Error('Mobile number not found');
        if (replyForm.template) {
          await sendWhatsappTemplate(mobile, replyForm.template);
        } else {
          await sendWhatsappMessage(mobile, replyForm.body);
        }
      }
      
      showToast('Reply sent', 'success');
      setReplyingToId(null);
      setReplyForm({ body: '', template: '' });
      await fetchMessages(selectedInbox._id);
    } catch (error) {
      console.error('Inline reply error:', error);
      showToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedInbox || !modal.data.noteBody || !modal.data.noteDueDate) return;
    setSending(true);
    try {
      await createNote(selectedInbox.owner?._id, modal.data.noteBody, modal.data.noteDueDate);
      showToast('Note created', 'success');
      closeModal();
    } catch { showToast('Failed to create note', 'error'); }
    finally { setSending(false); }
  };

  const getUser = (inbox) => inbox?.owner || {};
  const canShowActions = selectedInbox && selectedInbox.status !== 'resolved';
  const isStarted = selectedInbox && ['started', 'pending'].includes(selectedInbox.status);

  const getStatusColor = (status) => {
    const colors = { unread: '#f59e0b', read: '#3b82f6', started: '#8b5cf6', resolved: '#10b981', pending: '#ef4444' };
    return colors[status] || '#64748b';
  };

  // Styles
  const containerStyle = { display: 'flex', height: '100vh', marginRight: showContextPanel ? '340px' : 0, transition: 'margin-right 0.3s' };
  const listPanelStyle = { width: '360px', borderRight: '1px solid rgba(0,0,0,0.08)', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px -12px rgba(0,0,0,0.1)' };
  const listHeaderStyle = { padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.08)' };
  const filterBtnStyle = (active) => ({ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', background: active ? '#6366f1' : 'rgba(0,0,0,0.04)', color: active ? '#fff' : '#374151', cursor: 'pointer', transition: 'all 0.2s' });
  const inboxItemStyle = (isSelected, isUnread) => ({ padding: '16px', marginBottom: '8px', borderRadius: '12px', cursor: 'pointer', border: isSelected ? '1px solid #6366f1' : '1px solid transparent', background: isSelected ? 'rgba(99, 102, 241, 0.06)' : isUnread ? 'rgba(245, 158, 11, 0.04)' : '#fff', transition: 'all 0.2s' });
  const avatarStyle = (color) => ({ width: '44px', height: '44px', borderRadius: '12px', background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' });
  const chipStyle = (color) => ({ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${color}15`, color, textTransform: 'capitalize' });
  const messagePanelStyle = { flex: 1, display: 'flex', flexDirection: 'column', background: '#fafbfc' };
  const threadHeaderStyle = { height: '72px', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
  const buttonStyle = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: bg === 'transparent' ? '1px solid rgba(0,0,0,0.15)' : 'none', background: bg, color, cursor: 'pointer', transition: 'all 0.2s' });
  const messageStyle = (isOutgoing) => ({ maxWidth: '70%', marginBottom: '16px', marginLeft: isOutgoing ? 'auto' : 0, padding: '16px', borderRadius: '16px', background: isOutgoing ? '#6366f1' : '#fff', color: isOutgoing ? '#fff' : '#0f172a', boxShadow: isOutgoing ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)' });
  const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
  const modalStyle = { background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden' };
  const modalHeaderStyle = { padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', fontSize: '18px', fontWeight: 600 };
  const modalBodyStyle = { padding: '24px' };
  const modalFooterStyle = { padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px' };
  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' };
  const textareaStyle = { ...inputStyle, minHeight: '120px', resize: 'vertical' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const toastStyle = { position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: '#fff', background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 10000, animation: 'fadeIn 0.3s' };

  return (
    <MainLayout>
      <div style={containerStyle}>
        {/* Inbox List */}
        <div style={listPanelStyle}>
          <div style={listHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Inbox</h2>
              <button style={buttonStyle('transparent', '#374151')} onClick={loadInboxes} disabled={loading.inboxes}>
                {loading.inboxes ? <span className="spinner" /> : '🔄'}
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{filteredInboxes.length} conversations</p>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {statusFilters.map((f) => (
                <button key={f.value} style={filterBtnStyle(activeFilter === f.value)} onClick={() => setActiveFilter(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {loading.inboxes ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div>
            ) : filteredInboxes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <div>No conversations found</div>
              </div>
            ) : (
              filteredInboxes.map((inbox) => {
                const user = getUser(inbox);
                const isSelected = selectedInbox?._id === inbox._id;
                const initials = (user.fullname || user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
                const channelColor = inbox.source === 'whatsapp' ? '#25d366' : '#3b82f6';
                return (
                  <div key={inbox._id} style={inboxItemStyle(isSelected, inbox.status === 'unread')} onClick={() => handleInboxClick(inbox)}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={avatarStyle(channelColor)}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0, flex: 1 }}>
                            <span style={{ flexShrink: 0 }}>{inbox.source === 'whatsapp' ? '💬' : '📧'}</span>
                            <span style={{ fontWeight: inbox.status === 'unread' ? 700 : 600, fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                              {user.fullname || user.name || 'Unknown User'}
                            </span>
                          </div>
                          <span style={{ ...chipStyle(getStatusColor(inbox.status)), flexShrink: 0 }}>{inbox.status}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {inbox.preview || 'No preview available'}
                        </p>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(inbox.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div style={messagePanelStyle}>
          {selectedInbox ? (
            <>
              <div style={threadHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {(getUser(selectedInbox).fullname || getUser(selectedInbox).name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{getUser(selectedInbox).fullname || getUser(selectedInbox).name || 'Unknown User'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedInbox.source === 'whatsapp' ? '💬' : '📧'}
                      {getUser(selectedInbox).email || getUser(selectedInbox).mobile}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={chipStyle(getStatusColor(selectedInbox.status))}>{selectedInbox.status}</span>
                  {canShowActions && (
                    <>
                      {!isStarted ? (
                        <button style={buttonStyle('#10b981', '#fff')} onClick={handleStart}>▶️ Start</button>
                      ) : (
                        <button style={buttonStyle('transparent', '#10b981')} onClick={() => setModal({ type: 'resolve', data: {} })}>✅ Resolve</button>
                      )}
                    </>
                  )}
                  <button style={buttonStyle('transparent', '#374151')} onClick={() => setModal({ type: 'note', data: {} })}>📝 Add Note</button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                {loading.messages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><span className="spinner" /></div>
                ) : (
                  <>
                    {inboxMessages.map((msg) => {
                      const isOutgoing = msg.from === 'Support' || msg.direction === 'outbound';
                      return (
                        <div key={msg._id} style={messageStyle(isOutgoing)}>
                          {msg.subject && <div style={{ fontWeight: 600, marginBottom: '8px' }}>{msg.subject}</div>}
                          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body || msg.text}</div>
                          
                          {/* Attachments Display */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${isOutgoing ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', opacity: 0.8 }}>📎 Attachments:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {msg.attachments.map((attachment, idx) => (
                                  <a
                                    key={idx}
                                    href={attachment.url || attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '13px',
                                      color: isOutgoing ? '#fff' : '#6366f1',
                                      textDecoration: 'underline',
                                      wordBreak: 'break-word',
                                      opacity: 0.9,
                                      transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = '0.9'}
                                  >
                                    {typeof attachment === 'string' ? attachment.split('/').pop() : attachment.name || `Attachment ${idx + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span style={{ fontSize: '11px', opacity: 0.7 }}>{formatDate(msg.createdAt)}</span>
                            {!isOutgoing && isStarted && (
                              <button
                                style={{ background: 'transparent', border: 'none', color: isOutgoing ? '#fff' : '#6366f1', cursor: 'pointer', fontSize: '16px' }}
                                onClick={() => setReplyingToId(replyingToId === msg._id ? null : msg._id)}
                              >
                                ↩️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {isStarted && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Inline Reply Form - Shows when reply button is clicked */}
                  {replyingToId && (
                    <div style={{ borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '16px', background: 'rgba(99, 102, 241, 0.04)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#6366f1' }}>↩️ Reply</div>
                      
                      {/* Get the message being replied to */}
                      {inboxMessages.find(m => m._id === replyingToId)?.source === 'whatsapp' ? (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Mobile Number</div>
                            <input
                              type="text"
                              style={inputStyle}
                              placeholder="Mobile number"
                              value={selectedInbox.owner?.mobile || ''}
                              readOnly
                            />
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Template Name (Optional)</div>
                            <input
                              type="text"
                              style={inputStyle}
                              placeholder="Template name (for outside 24h window)"
                              value={replyForm.template || ''}
                              onChange={(e) => setReplyForm({ ...replyForm, template: e.target.value })}
                            />
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Message Body</div>
                            <textarea
                              style={textareaStyle}
                              placeholder="Message (within 24h window)"
                              value={replyForm.body || ''}
                              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
                            />
                          </div>
                        </>
                      ) : inboxMessages.find(m => m._id === replyingToId)?.source === 'web' ? (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Reply Message</div>
                            <textarea
                              style={textareaStyle}
                              placeholder="Type your reply..."
                              value={replyForm.body || ''}
                              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Email Address</div>
                            <input
                              type="email"
                              style={inputStyle}
                              placeholder="Email address"
                              value={selectedInbox.owner?.email || ''}
                              readOnly
                            />
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Reply Message</div>
                            <EmailEditor
                              value={replyForm.body || ''}
                              onChange={(value) => setReplyForm({ ...replyForm, body: value })}
                              placeholder="Your reply..."
                            />
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          style={buttonStyle('transparent', '#374151')}
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyForm({ body: '', template: '' });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          style={buttonStyle('#6366f1', '#fff')}
                          onClick={() => {
                            const msg = inboxMessages.find(m => m._id === replyingToId);
                            handleInlineReply(msg, msg?.source !== 'whatsapp');
                          }}
                          disabled={sending}
                        >
                          {sending ? <span className="spinner spinner-white" /> : '📤 Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Compose Buttons Section */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={buttonStyle('#3b82f6', '#fff')} onClick={() => setModal({ type: 'email', data: { email_address: selectedInbox.owner?.email || '', subject: '', body: '' } })}>
                      📧 Compose Email
                    </button>
                    <button style={buttonStyle('#25d366', '#fff')} onClick={() => setModal({ type: 'whatsapp', data: { mobile_number: selectedInbox.owner?.mobile || '', template_name: '' } })}>
                      💬 Compose WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>Select a conversation</div>
              <div style={{ fontSize: '14px' }}>Choose an inbox item to view the conversation</div>
            </div>
          )}
        </div>

        {showContextPanel && selectedInbox && (
          <ContextPanel inbox={selectedInbox} onClose={() => setShowContextPanel(false)} />
        )}
      </div>

      {/* Modals */}
      {modal.type === 'note' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>Create Note</div>
            <div style={modalBodyStyle}>
              <textarea style={textareaStyle} placeholder="Enter note..." value={modal.data.noteBody || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, noteBody: e.target.value } })} />
              <input type="text" style={inputStyle} placeholder="Due date (e.g., 27 jan 2026)" value={modal.data.noteDueDate || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, noteDueDate: e.target.value } })} />
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button style={buttonStyle('#6366f1', '#fff')} onClick={handleCreateNote} disabled={sending}>
                {sending ? <span className="spinner spinner-white" /> : 'Create Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'resolve' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>Resolve Conversation</div>
            <div style={modalBodyStyle}>
              <select style={selectStyle} value={modal.data.queryType || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, queryType: e.target.value } })}>
                <option value="">Select Query Type</option>
                {queryTypes.length > 0 ? (
                  queryTypes.map((qt) => (
                    <option key={qt._id || qt.name || qt} value={qt.name || qt}>
                      {qt.name || qt}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing Query">Billing Query</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Feature Request">Feature Request</option>
                  </>
                )}
              </select>
              <input type="text" style={inputStyle} placeholder="Or enter custom query type" value={modal.data.customQuery || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, customQuery: e.target.value } })} />
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button style={buttonStyle('#10b981', '#fff')} onClick={handleResolve}>Resolve</button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'email' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>Compose Email</div>
            <div style={modalBodyStyle}>
              <input type="email" style={inputStyle} placeholder="Email address" value={modal.data.email_address || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, email_address: e.target.value } })} />
              <input type="text" style={inputStyle} placeholder="Subject" value={modal.data.subject || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, subject: e.target.value } })} />
              <EmailEditor
                value={modal.data.body || ''}
                onChange={(value) => setModal({ ...modal, data: { ...modal.data, body: value } })}
                placeholder="Email body..."
              />
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button style={buttonStyle('#3b82f6', '#fff')} onClick={handleSendEmail} disabled={sending}>
                {sending ? <span className="spinner spinner-white" /> : '📧 Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'whatsapp' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>Compose WhatsApp</div>
            <div style={modalBodyStyle}>
              <input type="tel" style={inputStyle} placeholder="Mobile number" value={modal.data.mobile_number || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, mobile_number: e.target.value } })} />
              <input type="text" style={inputStyle} placeholder="Template name (e.g., t1)" value={modal.data.template_name || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, template_name: e.target.value } })} />
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button style={buttonStyle('#25d366', '#fff')} onClick={handleSendWhatsApp} disabled={sending}>
                {sending ? <span className="spinner spinner-white" /> : '💬 Send WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'reply' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>Reply to {modal.data.replyMessage?.source === 'whatsapp' ? 'WhatsApp' : 'Email'}</div>
            <div style={modalBodyStyle}>
              {modal.data.replyMessage?.source === 'whatsapp' ? (
                <>
                  <input type="text" style={inputStyle} placeholder="Template name (for outside 24h window)" value={modal.data.template || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, template: e.target.value } })} />
                  <textarea style={textareaStyle} placeholder="Or direct message (within 24h window)" value={modal.data.body || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, body: e.target.value } })} />
                </>
              ) : (
                <textarea style={textareaStyle} placeholder="Your reply..." value={modal.data.body || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, body: e.target.value } })} />
              )}
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button style={buttonStyle('#6366f1', '#fff')} onClick={handleReply} disabled={sending}>
                {sending ? <span className="spinner spinner-white" /> : '📤 Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.text && <div style={toastStyle}>{toast.text}</div>}
    </MainLayout>
  );
}
