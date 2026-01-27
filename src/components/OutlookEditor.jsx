import { useState } from 'react';
import { EmailEditor } from './EmailEditor';

export function OutlookEditor({ onSend, onCancel, isReply = false, recipientEmail = '' }) {
  const [email, setEmail] = useState(recipientEmail || '');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');

  const handleSend = () => {
    if (!email.trim()) {
      alert('Please enter email address');
      return;
    }
    if (!htmlBody.trim()) {
      alert('Please enter message body');
      return;
    }
    onSend({
      email: email.trim(),
      subject: isReply ? '' : subject.trim(),
      htmlBody,
    });
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
          {isReply ? 'Reply to Email' : 'Send Email'}
        </h3>
      </div>

      {/* Email Address Field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Email Address</label>
        <input
          type="email"
          placeholder="recipient@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Subject Field */}
      {!isReply && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Subject</label>
          <input
            type="text"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {/* Body - Using Quill Editor */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Message Body</label>
        <EmailEditor
          value={htmlBody}
          onChange={setHtmlBody}
          placeholder="Write your email message here..."
        />
      </div>

      <div style={actionsStyle}>
        <button style={cancelButtonStyle} onClick={onCancel}>
          Cancel
        </button>
        <button style={sendButtonStyle} onClick={handleSend}>
          Send Email
        </button>
      </div>
    </div>
  );
}
