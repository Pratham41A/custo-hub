import { useState, useEffect } from 'react';
import { EmailEditor } from './EmailEditor';

// default key used when no override is provided
const DEFAULT_STORAGE_KEY = 'email_compose_draft';

export function OutlookEditor({ onSend, onCancel, isReply = false, recipientEmail = '', storageKey }) {
  // determine which key to use for persisting drafts
  // - storageKey === null -> disable storage entirely
  // - storageKey === undefined -> use default global key
  // - otherwise use provided string
  let key;
  if (storageKey === null) {
    key = null;
  } else if (storageKey === undefined) {
    key = DEFAULT_STORAGE_KEY;
  } else {
    key = storageKey;
  }
  
  // DEBUG: log the computed key
  console.log('📧 OutlookEditor initialized with storageKey prop:', storageKey, '-> computed key:', key);

  // Initialize from localStorage or props
  const [email, setEmail] = useState(() => {
    if (recipientEmail) return recipientEmail;
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).email || '' : '';
  });
  const [subject, setSubject] = useState(() => {
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).subject || '' : '';
  });
  const [htmlBody, setHtmlBody] = useState(() => {
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).htmlBody || '' : '';
  });
  const [ccRecipients, setCcRecipients] = useState(() => {
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    const value = saved ? JSON.parse(saved).ccRecipients || '' : '';
    console.log('📥 CC initialized from localStorage:', { saved: saved ? JSON.parse(saved) : null, ccRecipients: value });
    return value;
  });
  const [bccRecipients, setBccRecipients] = useState(() => {
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    const value = saved ? JSON.parse(saved).bccRecipients || '' : '';
    console.log('📥 BCC initialized from localStorage:', { saved: saved ? JSON.parse(saved) : null, bccRecipients: value });
    return value;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (key === null) return; // skip persisting if storage is disabled
    const draft = { email, subject, htmlBody, ccRecipients, bccRecipients, timestamp: Date.now() };
    console.log('💾 Saving email draft to localStorage with key:', key, 'Data:', draft);
    localStorage.setItem(key, JSON.stringify(draft));
  }, [email, subject, htmlBody, ccRecipients, bccRecipients, key]);

  const handleSend = () => {
    if (!email.trim()) {
      alert('Please enter email address');
      return;
    }
    if (!htmlBody.trim()) {
      alert('Please enter message body');
      return;
    }

    // Debug log to see actual values
    console.log('📧 Email Send Debug:', {
      toRecipients: email.trim(),
      subject: subject.trim(),
      ccRecipients: ccRecipients.trim(),
      bccRecipients: bccRecipients.trim(),
    });

    onSend({
      toRecipients: email.trim(),
      subject: isReply ? '' : subject.trim(),
      htmlBody,
      ccRecipients: ccRecipients.trim(),
      bccRecipients: bccRecipients.trim(),
    });
    // Clear localStorage on successful send
    if (key) localStorage.removeItem(key);
  };

  const handleCancel = () => {
    // Keep localStorage data - don't clear on cancel
    onCancel();
  };

  const handlePaste = (e) => {
    // Prevent default paste behavior that can cause scroll jumps
    // The onChange handler will manage the state update
  };

  const containerStyle = {
    padding: '20px',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const headerStyle = {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
  };

  const titleStyle = {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#0f172a',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    justifyContent: 'flex-end',
  };

  const sendButtonStyle = {
    padding: '10px 20px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const cancelButtonStyle = {
    padding: '10px 20px',
    background: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {isReply ? 'Reply Email' : 'New Email'}
        </h3>
      </div>

      {/* Email Address Field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>TO</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPaste={handlePaste}
           placeholder="email1@example.com,email2@example.com"
          style={inputStyle}
        />
      </div>

      {/* CC Recipients Field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>CC (Optional)</label>
        <input
          type="text"
          placeholder="email1@example.com,email2@example.com"
          value={ccRecipients}
          onChange={(e) => {
            console.log('CC onChange fired:', e.target.value);
            setCcRecipients(e.target.value);
          }}
          onPaste={handlePaste}
          style={inputStyle}
        />
      </div>

      {/* BCC Recipients Field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>BCC (Optional)</label>
        <input
          type="text"
          placeholder="email1@example.com,email2@example.com"
          value={bccRecipients}
          onChange={(e) => {
            console.log('BCC onChange fired:', e.target.value);
            setBccRecipients(e.target.value);
          }}
          onPaste={handlePaste}
          style={inputStyle}
        />
      </div>

      {/* Subject Field */}
      {!isReply && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onPaste={handlePaste}
            style={inputStyle}
          />
        </div>
      )}

      {/* Body - Using Quill Editor */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Message</label>
        <EmailEditor
          value={htmlBody}
          onChange={setHtmlBody}
        />
      </div>

      <div style={actionsStyle}>
        <button style={cancelButtonStyle} onClick={handleCancel}>
          Cancel
        </button>
        <button style={sendButtonStyle} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
