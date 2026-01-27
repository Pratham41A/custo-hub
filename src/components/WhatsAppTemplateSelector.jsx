import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export function WhatsAppTemplateSelector({ onSend, onCancel, recipientMobile = '', inboxId = '' }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobile, setMobile] = useState(recipientMobile || '');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiService.fetchWhatsappTemplates();
      const templateList = data.whatsappTemplates || data.templates || data || [];
      setTemplates(templateList);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Initialize parameters
    const params = {};
    if (template.parameters && Array.isArray(template.parameters)) {
      template.parameters.forEach((param) => {
        params[param.name] = param.value || '';
      });
    }
    setParameters(params);
  };

  const handleParameterChange = (paramName, value) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleSend = async () => {
    if (!mobile.trim()) {
      alert('Please enter mobile number');
      return;
    }
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    try {
      setSending(true);
      // Create template object with parameter values
      const templateToSend = {
        name: selectedTemplate.name,
        language_code: selectedTemplate.language_code,
        components: selectedTemplate.components,
        parameters: selectedTemplate.parameters?.map(param => ({
          ...param,
          value: parameters[param.name] || ''
        })) || []
      };

      onSend({
        mobile: mobile.trim(),
        template: templateToSend,
      });
    } catch (error) {
      console.error('Failed to send template:', error);
      alert('Failed to send template');
    } finally {
      setSending(false);
    }
  };

  // Layout Styles
  const containerStyle = {
    display: 'flex',
    height: '100%',
    background: '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  };

  const leftPanelStyle = {
    flex: '0 0 45%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e2e8f0',
    padding: '28px',
    background: '#fff',
    overflowY: 'auto',
  };

  const rightPanelStyle = {
    flex: '0 0 55%',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px',
    background: '#f8fafc',
    overflowY: 'auto',
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
    marginTop: '0',
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    marginBottom: '18px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '7px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    outline: 'none',
  };

  const selectStyle = {
    width: '100%',
    padding: '11px 14px',
    marginBottom: '18px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '7px',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: '#fff',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    outline: 'none',
  };

  const parameterRowStyle = {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  };

  const previewStyle = {
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    minHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
  };

  const previewBodyStyle = {
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginBottom: '16px',
    color: '#1e293b',
    lineHeight: '1.6',
    fontWeight: 500,
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    justifyContent: 'flex-end',
  };

  const sendButtonStyle = {
    padding: '11px 24px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s',
  };

  const cancelButtonStyle = {
    padding: '11px 24px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1.5px solid #cbd5e1',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) {
      return (
        <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '40px' }}>
          Select a template to see preview
        </div>
      );
    }

    const bodyComponent = selectedTemplate.components?.find(c => c.type === 'body');
    const buttonComponents = selectedTemplate.components?.filter(c => c.type === 'url') || [];

    let bodyText = bodyComponent?.text || '';
    // Replace parameters with their values
    if (selectedTemplate.parameters && Array.isArray(selectedTemplate.parameters)) {
      selectedTemplate.parameters.forEach(param => {
        if (param.name && param.name.trim()) {
          const paramName = param.name;
          // Get value from user input (stored in parameters state) or show placeholder
          const paramValue = parameters[paramName] || '';
          // Escape special regex characters in paramName to avoid regex errors
          const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Replace with value if provided, otherwise leave placeholder as is
          if (paramValue) {
            bodyText = bodyText.replace(new RegExp(escapedParamName, 'g'), paramValue);
          }
        }
      });
    }

    // Format WhatsApp text: *bold*, _italic_, ~strikethrough~, ```monospace```
    const formatWhatsAppText = (text) => {
      // First handle triple backticks (monospace/code)
      const parts = text.split(/(```.*?```)/gs);
      return parts.flatMap((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3);
          return (
            <code key={partIdx} style={{ 
              background: '#f1f5f9', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {code}
            </code>
          );
        }
        // Then handle *bold*, _italic_, ~strikethrough~
        return part.split(/\*(.*?)\*|_(.*?)_|~(.*?)~/g).map((subPart, idx) => {
          if (idx % 4 === 1) return <strong key={`${partIdx}-${idx}`}>{subPart}</strong>;
          if (idx % 4 === 2) return <em key={`${partIdx}-${idx}`}>{subPart}</em>;
          if (idx % 4 === 3) return <del key={`${partIdx}-${idx}`}>{subPart}</del>;
          return <span key={`${partIdx}-${idx}`}>{subPart}</span>;
        });
      });
    };

    return (
      <div style={previewStyle}>
        <div style={previewBodyStyle}>{formatWhatsAppText(bodyText)}</div>
        {buttonComponents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {buttonComponents.map((btn, idx) => (
              <a
                key={idx}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#6366f1',
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                }}
              >
                {btn.text}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading templates...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* LEFT PANEL */}
      <div style={leftPanelStyle}>
        {/* Mobile Number */}
        <div>
          <label style={sectionTitleStyle}>Mobile Number</label>
          <input
            type="text"
            placeholder="Enter mobile number (e.g., +91xxxxxxxxxx)"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Template Selection */}
        <div>
          <label style={sectionTitleStyle}>Select Template</label>
          <select
            style={selectStyle}
            value={selectedTemplate?.name || ''}
            onChange={(e) => {
              const template = templates.find(t => t.name === e.target.value);
              if (template) handleTemplateSelect(template);
            }}
          >
            <option value="">-- Select a template --</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parameters Input */}
        {selectedTemplate && selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
          <div>
            <label style={sectionTitleStyle}>Parameters</label>
            {selectedTemplate.parameters.map((param) => (
              <div key={param.name} style={parameterRowStyle}>
                <label style={labelStyle}>{param.name}</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder={`Enter value for ${param.name}`}
                  value={parameters[param.name] || ''}
                  onChange={(e) => handleParameterChange(param.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={buttonContainerStyle}>
          <button style={cancelButtonStyle} onClick={onCancel} disabled={sending}>
            Cancel
          </button>
          <button
            style={sendButtonStyle}
            onClick={handleSend}
            disabled={!selectedTemplate || !mobile.trim() || sending}
            onMouseEnter={(e) => !(!selectedTemplate || !mobile.trim() || sending) && (e.target.style.background = '#059669')}
            onMouseLeave={(e) => (e.target.style.background = '#10b981')}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - PREVIEW */}
      <div style={rightPanelStyle}>
        <div>
          <label style={{ ...sectionTitleStyle, marginTop: 0 }}>Live Preview</label>
          {renderTemplatePreview()}
        </div>
      </div>
    </div>
  );
}
