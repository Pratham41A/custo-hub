import { useState } from 'react';

export function OutlookEditor({ onSend, onCancel, isReply = false, recipientEmail = '' }) {
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleSend = () => {
    if (!htmlBody.trim()) {

      return;
    }
    onSend({
      subject: isReply ? '' : subject,
      htmlBody,
      email: recipientEmail,
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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const toolbarStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px',
    background: '#f8fafc',
    borderRadius: '6px',
    flexWrap: 'wrap',
  };

  const buttonStyle = {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: '#6366f1',
    color: '#fff',
    border: '1px solid #6366f1',
  };

  const editorStyle = {
    width: '100%',
    minHeight: '300px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
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
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>
          {isReply ? 'Reply to Email' : 'Send Email'}
        </h3>
        {recipientEmail && (
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>
            To: {recipientEmail}
          </p>
        )}
      </div>

      {!isReply && (
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={inputStyle}
        />
      )}

      <div style={toolbarStyle}>
        <button
          style={isBold ? activeButtonStyle : buttonStyle}
          onClick={() => {
            applyFormat('bold');
            setIsBold(!isBold);
          }}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          style={isItalic ? activeButtonStyle : buttonStyle}
          onClick={() => {
            applyFormat('italic');
            setIsItalic(!isItalic);
          }}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          style={isUnderline ? activeButtonStyle : buttonStyle}
          onClick={() => {
            applyFormat('underline');
            setIsUnderline(!isUnderline);
          }}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <span style={{ width: '1px', background: '#cbd5e1' }}></span>
        <button
          style={buttonStyle}
          onClick={() => applyFormat('createUnorderedList')}
          title="Bullet List"
        >
          • List
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            const fontSize = prompt('Font size (1-7):', '3');
            if (fontSize) applyFormat('fontSize', fontSize);
          }}
          title="Font Size"
        >
          A↔️
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            const color = prompt('Font color (hex):', '#000000');
            if (color) applyFormat('foreColor', color);
          }}
          title="Font Color"
        >
          🎨 Color
        </button>
        <button
          style={buttonStyle}
          onClick={() => applyFormat('removeFormat')}
          title="Clear Formatting"
        >
          ✕ Format
        </button>
      </div>

      <div
        contentEditable
        suppressContentEditableWarning
        style={editorStyle}
        onInput={(e) => setHtmlBody(e.currentTarget.innerHTML)}
        placeholder="Write your message here..."
      />

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
