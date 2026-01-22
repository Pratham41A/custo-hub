import { useState } from 'react';

export function WhatsAppEditor({ onSend, onCancel, isReply = false, recipientMobile = '' }) {
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates] = useState([
    { value: 'greeting', label: 'Greeting' },
    { value: 'support', label: 'Support Inquiry' },
    { value: 'update', label: 'Status Update' },
    { value: 'feedback', label: 'Feedback Request' },
  ]);

  const handleSend = () => {
    if (!body.trim() && !selectedTemplate) {
      
      return;
    }
    onSend({
      body: body.trim(),
      template: selectedTemplate,
      mobile: recipientMobile,
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
    color: '#0f172a',
  };

  const subtitleStyle = {
    margin: '4px 0',
    fontSize: '13px',
    color: '#64748b',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '200px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  };

  const charCountStyle = {
    fontSize: '12px',
    color: body.length > 160 ? '#ef4444' : '#64748b',
    marginTop: '4px',
    marginBottom: '12px',
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

  const previewStyle = {
    padding: '12px',
    background: '#f0fdf4',
    border: '1px solid #dcfce7',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#166534',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {isReply ? 'Reply via WhatsApp' : 'Send WhatsApp Message'}
        </h3>
        {recipientMobile && (
          <p style={subtitleStyle}>
            To: {recipientMobile}
          </p>
        )}
      </div>

      <label style={labelStyle}>Template (Optional)</label>
      <select
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
        style={selectStyle}
      >
        <option value="">-- Select a template or type your message --</option>
        {templates.map((template) => (
          <option key={template.value} value={template.value}>
            {template.label}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Message</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your WhatsApp message here... (SMS style - plain text)"
        style={textareaStyle}
      />
      <div style={charCountStyle}>
        {body.length} characters {body.length > 160 && '(will use multiple messages)'}
      </div>

      {selectedTemplate && (
        <div style={previewStyle}>
          ✓ Template selected: <strong>{templates.find(t => t.value === selectedTemplate)?.label}</strong>
        </div>
      )}

      <div style={actionsStyle}>
        <button style={cancelButtonStyle} onClick={onCancel}>
          Cancel
        </button>
        <button style={sendButtonStyle} onClick={handleSend}>
          Send Message
        </button>
      </div>
    </div>
  );
}
