import { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '../store/globalStore';
import { MainLayout } from '../components/layout/MainLayout';
import { ContextPanel } from '../components/layout/ContextPanel';
import { EmailEditor } from '../components/EmailEditor';
import { OutlookEditor } from '../components/OutlookEditor';
import { WhatsAppEditor } from '../components/WhatsAppEditor';
import { MessageBubble } from '../components/MessageBubble';

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
  // Timezone conversion helper - Convert IST datetime-local input to UTC ISO string
  const convertISTtoUTC = (istDateTimeString) => {
    if (!istDateTimeString) return null;
    // istDateTimeString format: "2026-01-22T14:30" (from datetime-local)
    const date = new Date(istDateTimeString);
    // IST is UTC+5:30, subtract to get UTC equivalent
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const utcTime = new Date(date.getTime() - istOffsetMs);
    return utcTime.toISOString();
  };

  // Check if current UTC time is past the template time
  const isTemplateTimeExpired = (templateTime) => {
    if (!templateTime) return false;
    const currentUTC = new Date();
    const templateUTC = new Date(templateTime);
    return currentUTC > templateUTC;
  };

  const {
    inboxes, messages, selectedInbox, setSelectedInbox, setInboxes, updateInboxStatus,
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
  const [hoveredInboxId, setHoveredInboxId] = useState(null);
  const [composingType, setComposingType] = useState(null);
  const [composeForm, setComposeForm] = useState({ email: '', subject: '', body: '', mobile: '', template: '' });
  const messagesEndRef = useRef(null);
  const messageRefsMap = useRef({});

  useEffect(() => { loadInboxes(); }, [activeFilter]);
  useEffect(() => { fetchQueryTypes(); }, [fetchQueryTypes]);
  
  // Enable audio playback on user interaction
  useEffect(() => {
    const enableAudio = () => {
      try {
        // Import socketService and initialize its AudioContext
        import('../services/socketService').then(({ socketService }) => {
          socketService.initAudioContext();
        });
      } catch (error) {
        // Audio initialization failed
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

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

  // Check if a string is HTML format
  const isHtmlFormat = (text) => {
    if (!text) return false;
    return /<[^>]*>/.test(text);
  };

  // Extract plain text from HTML string
  const getPlainTextFromHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&lt;/g, '<') // Decode &lt;
      .replace(/&gt;/g, '>') // Decode &gt;
      .replace(/&amp;/g, '&') // Decode &amp;
      .trim(); // Trim whitespace
  };

  // Scroll to a specific message when clicking on a reply quote
  const handleScrollToMessage = (messageId) => {
    const messageElement = messageRefsMap.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
              return withYear;
            }
          }
          return withYear;
        }
      } catch (e) {
        // Error parsing date
      }
    }
    // Fallback to createdAt
    const fallback = parseDate(created);
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
      const searchLower = search.toLowerCase();
      
      // Owner fields to search
      const ownerFields = [
        i.owner?.email,
        i.owner?.fullname,
        i.owner?.name,
        i.owner?.mobileno,
        i.owner?.registeredfrom,
        i.owner?.country,
        i.owner?.usercountry,
      ];
      
      // Check interests array if it exists
      if (i.owner?.interest && Array.isArray(i.owner.interest)) {
        i.owner.interest.forEach(int => {
          ownerFields.push(int.interests || int);
        });
      }
      
      // DummyOwner fields to search
      const dummyOwnerFields = [
        i.dummyOwner?.name,
        i.dummyOwner?.email,
        i.dummyOwner?.mobileno,
      ];
      
      // Inbox preview field
      const inboxFields = [
        i.preview,
      ];
      
      // Combine all searchable fields
      const allFields = [...ownerFields, ...dummyOwnerFields, ...inboxFields];
      
      // Check if any field contains the search term
      return allFields.some(field => 
        field && String(field).toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // First, sort by isUnread: unread inboxes come first
      if (a.isUnread !== b.isUnread) {
        return b.isUnread ? 1 : -1; // true (unread) comes before false (read)
      }

      // Then sort by status order
      const orderA = statusOrder[a.status] ?? 999;
      const orderB = statusOrder[b.status] ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      // Within the same status group, sort by a reliable timestamp descending (latest first)
      const aTime = getItemTimestamp(a);
      const bTime = getItemTimestamp(b);
      const diff = bTime - aTime;
      return diff;
    });

  const inboxMessages = messages
    .filter((m) => m.inbox?._id === selectedInbox?._id)
    .sort((a, b) => {
      const timeA = new Date(a.messageDateTime || a.createdAt).getTime();
      const timeB = new Date(b.messageDateTime || b.createdAt).getTime();
      return timeA - timeB; // Oldest first (ascending) - latest at bottom
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inboxMessages]);

  const handleInboxClick = async (inbox) => {
    // Toggle selection: if clicking same inbox, deselect and hide panel
    if (selectedInbox?._id === inbox._id) {
      setSelectedInbox(null);
      setShowContextPanel(false);
      return;
    }
    
    // Select new inbox and hide context panel by default
    setSelectedInbox(inbox);
    setShowContextPanel(false);
    try {
      const msgData = await fetchMessages(inbox._id);
      
      // Mark as read if unread - use API response data
      if (inbox.isUnread) {
        // Call API and get updated inbox data from response
        const updatedInboxData = await updateInboxStatus(inbox._id, 'read');
        
        // Update state with all fields returned from API
        const updatedInboxes = inboxes.map(i =>
          i._id === inbox._id ? { ...i, ...updatedInboxData } : i
        );
        setInboxes(updatedInboxes);
        
        showToast('Marked as read', 'info');
      }
    } catch (error) {
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

  const handleSendEmail = async (data = null) => {
    const sendData = data || modal.data;
    if (!selectedInbox || !sendData.subject || !sendData.htmlBody) return;
    const email = sendData.email || selectedInbox.owner?.email || selectedInbox.owner?.dummyOwner?.name || selectedInbox.dummyOwner?.name;
    if (!email) {
      showToast('Email address not found', 'error');
      console.error('Email lookup failed:', { sendData, owner: selectedInbox.owner, dummyOwner: selectedInbox.dummyOwner });
      return;
    }
    setSending(true);
    try {
      await sendNewEmail(email, sendData.subject, sendData.htmlBody);
      showToast('Email sent', 'success');
      closeModal();
      await fetchMessages(selectedInbox._id);
    } catch { showToast('Failed to send email', 'error'); }
    finally { setSending(false); }
  };

  const handleSendWhatsApp = async (data = null) => {
    const sendData = data || modal.data;
    if (!selectedInbox || !sendData.body && !sendData.template) return;
    const mobile = sendData.mobile || selectedInbox.owner?.mobileno || selectedInbox.owner?.mobile || selectedInbox.owner?.dummyOwner?.mobile || selectedInbox.dummyOwner?.mobile;
    if (!mobile) {
      showToast('Mobile number not found', 'error');
      console.error('Mobile lookup failed:', { sendData, owner: selectedInbox.owner, dummyOwner: selectedInbox.dummyOwner });
      return;
    }
    setSending(true);
    try {
      if (sendData.template) {
        await sendWhatsappTemplate(mobile, sendData.template);
      } else if (sendData.body) {
        await sendWhatsappMessage(mobile, sendData.body);
      }
      showToast('WhatsApp message sent', 'success');
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
        const mobile = selectedInbox.owner?.mobileno || selectedInbox.owner?.mobile || selectedInbox.owner?.dummyOwner?.mobile || selectedInbox.dummyOwner?.mobile;
        console.log('Owner object properties:', selectedInbox.owner);
        console.log('Sending WhatsApp template reply:', { mobile, template: modal.data.template });
        if (!mobile) throw new Error('Mobile number not found');
        await sendWhatsappTemplate(mobile, modal.data.template);
      } else if (isWhatsApp && modal.data.body) {
        const mobile = selectedInbox.owner?.mobileno || selectedInbox.owner?.mobile || selectedInbox.owner?.dummyOwner?.mobile || selectedInbox.dummyOwner?.mobile;
        console.log('Sending WhatsApp message reply:', { mobile, body: modal.data.body });
        if (!mobile) throw new Error('Mobile number not found');
        await sendWhatsappMessage(mobile, modal.data.body);
      } else if (modal.data.body) {
        const email = selectedInbox.owner?.email || selectedInbox.owner?.dummyOwner?.name || selectedInbox.dummyOwner?.name;
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
    if (!selectedInbox || (!replyForm.body && !replyForm.template)) return;
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
        } else {
          throw new Error('Socket connection not available');
        }
      } else if (isSendingEmail || !isWhatsApp) {
        // Send Email Reply
        const email = selectedInbox.owner?.email || selectedInbox.dummyOwner?.email || selectedInbox.dummyOwner?.name || selectedInbox.owner?.dummyOwner?.email;
        if (!email) throw new Error('Email not found');
        await sendEmailReply(message?.messageId, replyForm.body, email);
      } else {
        // Send WhatsApp Reply
        const mobile = selectedInbox.owner?.mobile || selectedInbox.owner?.mobileno;
        if (!mobile) throw new Error('Mobile number not found');
        
        // Check if current time is past template time
        if (isTemplateTimeExpired(selectedInbox.whatsappConversationEndDateTime)) {
          // Current time > Template time - send template
          if (replyForm.template) {
            await sendWhatsappTemplate(mobile, replyForm.template);
          } else {
            throw new Error('Template name required');
          }
        } else {
          // Current time <= Template time - send direct message
          if (replyForm.body) {
            await sendWhatsappMessage(mobile, replyForm.body);
          } else {
            throw new Error('Message body required');
          }
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
      // Convert IST datetime-local input to UTC ISO string for API
      const utcDateTime = convertISTtoUTC(modal.data.noteDueDate);
      await createNote(selectedInbox._id, modal.data.noteBody, utcDateTime);
      showToast('Note created', 'success');
      closeModal();
    } catch { showToast('Failed to create note', 'error'); }
    finally { setSending(false); }
  };

  // Get display name from inbox - prioritize owner.fullname, then dummyOwner.name
  const getDisplayName = (inbox) => {
    // Handle owner object (can be string ID or full object)
    let owner = inbox?.owner;
    if (typeof owner === 'string') {
      owner = null; // It's just an ID, skip it
    }
    
    // Handle dummyOwner object (can be string ID or full object)
    let dummyOwner = inbox?.dummyOwner;
    if (typeof dummyOwner === 'string') {
      dummyOwner = null; // It's just an ID, skip it
    }
    
    const user = owner || dummyOwner || {};
    const displayName = user.fullname || user.name || user.email || 'Unknown User';
    return displayName;
  };

  const getUser = (inbox) => inbox?.owner || inbox?.dummyOwner || {};
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
  const buttonStyle = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', padding: '5px 5px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, border: bg === 'transparent' ? '1px solid rgba(0,0,0,0.15)' : 'none', background: bg, color, cursor: 'pointer', transition: 'all 0.2s' });
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
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
              <div >
              </div>
            ) : (
              filteredInboxes.map((inbox) => {
                const user = getUser(inbox);
                const isSelected = selectedInbox?._id === inbox._id;
                const initials = (user.fullname || user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
                const channelColor = inbox.source === 'whatsapp' ? '#25d366' : '#3b82f6';
                const statusColor = getStatusColor(inbox.status);
                
                return (
                  <div 
                    key={inbox._id} 
                    onClick={() => handleInboxClick(inbox)}
                    style={{
                      padding: '14px 16px',
                      marginBottom: '10px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : inbox.isUnread ? '#fef9e7' : '#fff',
                      border: isSelected ? '2px solid #6366f1' : inbox.isUnread ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : inbox.isUnread ? '0 2px 8px rgba(252, 211, 77, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.boxShadow = inbox.isUnread ? '0 4px 12px rgba(252, 211, 77, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.boxShadow = inbox.isUnread ? '0 2px 8px rgba(252, 211, 77, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)')}
                  >
                    {/* Avatar with Channel Icon */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={avatarStyle(channelColor)}>{initials}</div>
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          background: '#fff',
                          border: '2px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {inbox.source === 'whatsapp' ? (
                          <img src="https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Whatsapp.png" alt="WhatsApp" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                        ) : inbox.source === 'email' ? (
                          <img src="https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Email.png" alt="Email" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}></span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Top Row: Name and Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span 
                          style={{
                            fontWeight: inbox.isUnread ? 700 : 600,
                            fontSize: '13px',
                            color: '#0f172a',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getDisplayName(inbox)}
                        </span>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: `${statusColor}15`,
                            color: statusColor,
                            textTransform: 'capitalize',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {inbox.status}
                        </span>
                      </div>

                      {/* Middle Row: Preview */}
                      <div 
                        style={{
                          fontSize: '12px',
                          color: inbox.isUnread ? '#7c2d12' : '#64748b',
                          fontWeight: inbox.isUnread ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'default'
                        }}
                        title={isHtmlFormat(inbox.preview) ? getPlainTextFromHtml(inbox.preview) : (inbox.preview || 'No preview available')}
                      >
                        {isHtmlFormat(inbox.preview) ? (
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline'
                            }}
                            dangerouslySetInnerHTML={{
                              __html: inbox.preview
                            }}
                          />
                        ) : (
                          inbox.preview || 'No preview available'
                        )}
                      </div>

                      {/* Bottom Row: DateTime */}
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {formatDate(inbox.inboxDateTime)}
                      </span>
                    </div>

                    {/* Unread Indicator */}
                    {inbox.isUnread && (
                      <div 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}
                      />
                    )}
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
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    
                  {canShowActions && (
                    <>
                      {!isStarted ? (
                        <button style={buttonStyle('#000000', '#ffffff')} onClick={handleStart}>Start</button>
                      ) : (
                        <button style={buttonStyle('#000000', '#fbfbfb')} onClick={() => setModal({ type: 'resolve', data: {} })}>Resolve</button>
                      )}
                    </>
                  )}
               
                  <button style={buttonStyle('transparent', '#374151')} onClick={() => setModal({ type: 'note', data: {} })}>Add Note</button>
                     {!showContextPanel && (
                    <button 
                      style={buttonStyle('transparent', '#374151')} 
                      onClick={() => setShowContextPanel(true)}
                      title="Show customer details"
                    >
                      👤 
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                {loading.messages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><span className="spinner" /></div>
                ) : (
                  <>
                    {inboxMessages.map((msg) => (
                      <div 
                        key={msg._id}
                        ref={(el) => {
                          if (el) messageRefsMap.current[msg._id] = el;
                        }}
                      >
                        <MessageBubble
                          msg={msg}
                          allMessages={inboxMessages}
                          isStarted={isStarted}
                          onReply={(messageId) => setReplyingToId(replyingToId === messageId ? null : messageId)}
                          onScrollToMessage={handleScrollToMessage}
                        />
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isStarted && (
                  <>
                    {/* Inline Reply Form - Shows when reply button is clicked */}
                    {replyingToId && (
                      <div style={{ 
                        borderRadius: '12px', 
                        border: '1px solid rgba(99, 102, 241, 0.3)', 
                        padding: '16px', 
                        background: 'rgba(99, 102, 241, 0.04)', 
                        height: inboxMessages.find(m => m._id === replyingToId)?.source === 'whatsapp' && isTemplateTimeExpired(selectedInbox?.whatsappConversationEndDateTime) ? '150px' : '250px',
                        overflow: 'auto' 
                      }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px', color: '#6366f1' }}>⤴ Reply</div>
                      
                      {/* Get the message being replied to */}
                      {inboxMessages.find(m => m._id === replyingToId)?.source === 'whatsapp' ? (
                        <>
                          {isTemplateTimeExpired(selectedInbox?.whatsappConversationEndDateTime) ? (
                            // Current time > Template time - show Template Name input
                            <div style={{  }}>
                              <input
                                type="text"
                                style={inputStyle}
                                placeholder="Template Name"
                                value={replyForm.template || ''}
                                onChange={(e) => setReplyForm({ ...replyForm, template: e.target.value })}
                              />
                            </div>
                          ) : (
                            // Current time <= Template time - show Reply input
                            <div style={{  }}>
                              
                              <textarea
                                style={textareaStyle}
                               value={replyForm.body || ''}
                                onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
                              />
                            </div>
                          )}
                        </>
                      ) : inboxMessages.find(m => m._id === replyingToId)?.source === 'web' ? (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            
                            <textarea
                              style={textareaStyle}
                             
                              value={replyForm.body || ''}
                              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <EmailEditor
                              value={replyForm.body || ''}
                              onChange={(value) => setReplyForm({ ...replyForm, body: value })}
               
                            />
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          style={buttonStyle('transparent', '#050c18')}
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
                          {sending ? <span className="spinner spinner-white" /> : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}

                {/* Compose Buttons Section - Bottom Right - Always Visible */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        color: '#000',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        setComposingType('email');
                        setComposeForm({ email: selectedInbox.owner?.email || selectedInbox.dummyOwner?.email || '', subject: '', body: '', mobile: '', template: '' });
                      }}
                    >
                      <img src="https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Email.png" alt="Email" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      <span>New</span>
                    </button>
                    <button 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        color: '#000',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        setComposingType('whatsapp');
                        setComposeForm({ email: '', subject: '', body: '', mobile: selectedInbox.owner?.mobile || selectedInbox.owner?.mobileno || selectedInbox.dummyOwner?.mobile || selectedInbox.owner?.dummyOwner?.mobile || '', template: '' });
                      }}
                    >
                      <img src="https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Whatsapp.png" alt="WhatsApp" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Inline Compose Section - Email */}
                  {composingType === 'email' && (
                    <div style={{ 
                      borderRadius: '12px', 
                      border: '1px solid rgba(59, 130, 246, 0.3)', 
                      padding: '16px', 
                      background: 'rgba(59, 130, 246, 0.04)' 
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#3b82f6' }}>Email</div>
                      
                      <div style={{ }}>
                        <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>To</label>
                        <input
                          type="email"
                          style={inputStyle}
                          placeholder="Email Address"
                          value={composeForm.email}
                          onChange={(e) => setComposeForm({ ...composeForm, email: e.target.value })}
                        />
                      </div>
                      
                      <div style={{  }}>
                        <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>Subject</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="Subject"
                          value={composeForm.subject}
                          onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
        
                        <EmailEditor
                          value={composeForm.body || ''}
                          onChange={(value) => setComposeForm({ ...composeForm, body: value })}
                          placeholder=""
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          style={buttonStyle('transparent', '#050c18')}
                          onClick={() => {
                            setComposingType(null);
                            setComposeForm({ email: '', subject: '', body: '', mobile: '', template: '' });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          style={buttonStyle('#3b82f6', '#fff')}
                          onClick={() => {
                            handleSendEmail({ email: composeForm.email, subject: composeForm.subject, htmlBody: composeForm.body });
                            setComposingType(null);
                            setComposeForm({ email: '', subject: '', body: '', mobile: '', template: '' });
                          }}
                          disabled={sending}
                        >
                          {sending ? <span className="spinner spinner-white" /> : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Compose Section - WhatsApp */}
                  {composingType === 'whatsapp' && (
                    <div style={{ 
                      borderRadius: '12px', 
                      border: '1px solid rgba(37, 211, 102, 0.3)', 
                      padding: '16px', 
                      background: 'rgba(37, 211, 102, 0.04)' 
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#25d366' }}>WhatsApp</div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        
                        <input
                          type="tel"
                          style={inputStyle}
                          placeholder="Mobile Number"
                          value={composeForm.mobile}
                          onChange={(e) => setComposeForm({ ...composeForm, mobile: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="Template Name"
                          value={composeForm.template}
                          onChange={(e) => setComposeForm({ ...composeForm, template: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          style={buttonStyle('transparent', '#050c18')}
                          onClick={() => {
                            setComposingType(null);
                            setComposeForm({ email: '', subject: '', body: '', mobile: '', template: '' });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          style={buttonStyle('#25d366', '#fff')}
                          onClick={() => {
                            handleSendWhatsApp({ mobile: composeForm.mobile, template: composeForm.template, body: composeForm.body });
                            setComposingType(null);
                            setComposeForm({ email: '', subject: '', body: '', mobile: '', template: '' });
                          }}
                          disabled={sending}
                        >
                          {sending ? <span className="spinner spinner-white" /> : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
              <div style={{ fontSize: '50px', fontWeight: 500 }}>OnferenceTV</div>
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
            <div style={modalHeaderStyle}> Add Note</div>
            <div style={modalBodyStyle}>
              {/* Note Body */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Note</label>
                <textarea 
                  style={{ ...textareaStyle, borderColor: '#cbd5e1', borderWidth: '1.5px', fontFamily: 'inherit', fontSize: '14px' }} 
                  value={modal.data.noteBody || ''} 
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, noteBody: e.target.value } })} 
                />
              </div>

              {/* Due Date DateTime Picker */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Due Date </label>
                <div style={{ position: 'relative', borderRadius: '10px', border: '1.5px solid #cbd5e1', overflow: 'hidden', background: '#fff', transition: 'all 0.2s ease' }}>
                  <input 
                    type="datetime-local" 
                    style={{ width: '100%', padding: '12px 14px', border: 'none', fontSize: '14px', outline: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }} 
                    value={modal.data.noteDueDate || ''} 
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, noteDueDate: e.target.value } })} 
                  />
                </div>

                {/* Display selected datetime info */}

              </div>
            </div>
            <div style={modalFooterStyle}>
              <button style={buttonStyle('transparent', '#374151')} onClick={closeModal}>Cancel</button>
              <button 
                style={buttonStyle('#6366f1', '#fff')} 
                onClick={handleCreateNote} 
                disabled={sending || !modal.data.noteBody || !modal.data.noteDueDate}
              >
                {sending ? <span className="spinner spinner-white" /> : 'Add'}
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
              {queryTypes.length > 0 ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Select Query Type</div>
                    <select style={selectStyle} value={modal.data.queryType || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, queryType: e.target.value } })}>
                      <option value="">Select Query Type</option>
                      {queryTypes.map((qt) => (
                        <option key={qt._id || qt.name || qt} value={qt.name || qt}>
                          {qt.name || qt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Or Enter Custom Query Type</div>
                    <input type="text" style={inputStyle} placeholder="Custom query type (optional)" value={modal.data.customQuery || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, customQuery: e.target.value } })} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Enter Query Type</div>
                  <input type="text" style={inputStyle} placeholder="Enter query type" value={modal.data.customQuery || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, customQuery: e.target.value } })} />
                </>
              )}
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
          <div style={{ ...modalStyle, maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <OutlookEditor
              isReply={false}
              recipientEmail={selectedInbox?.owner?.email || selectedInbox?.owner?.dummyOwner?.name || selectedInbox?.dummyOwner?.name || ''}
              onSend={(data) => {
                handleSendEmail(data);
              }}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'whatsapp' && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={{ ...modalStyle, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <WhatsAppEditor
              isReply={false}
              recipientMobile={selectedInbox?.owner?.mobileno || selectedInbox?.owner?.mobile || selectedInbox?.owner?.dummyOwner?.mobile || selectedInbox?.dummyOwner?.mobile || ''}
              onSend={(data) => {
                handleSendWhatsApp(data);
              }}
              onCancel={closeModal}
            />
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
                <textarea style={textareaStyle} value={modal.data.body || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, body: e.target.value } })} />
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
