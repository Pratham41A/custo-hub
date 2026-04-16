import { useState, useEffect } from 'react';
import { useGlobalStore } from '../store/globalStore';

// default key if nothing else provided
const DEFAULT_WHATSAPP_KEY = 'whatsapp_compose_draft';

export function WhatsAppTemplateSelector({ onSend, onCancel, recipientMobile = '', inboxId = '', storageKey }) {
  // determine actual key to use
  // key === null -> disable storage
  // key undefined -> choose based on inboxId or default
  let key;
  if (storageKey === null) {
    key = null;
  } else if (storageKey === undefined) {
    key = inboxId ? `whatsapp_compose_inbox_${inboxId}` : DEFAULT_WHATSAPP_KEY;
  } else {
    key = storageKey;
  }

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (key === null) return null;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).selectedTemplate || null : null;
  });
  const [parameters, setParameters] = useState(() => {
    if (key === null) return {};
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).parameters || {} : {};
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobile, setMobile] = useState(recipientMobile || (() => {
    if (key === null) return '';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).mobile || '' : '';
  })());
  const [focusedParamName, setFocusedParamName] = useState(null);

  const whatsappTemplates = useGlobalStore(state => state.whatsappTemplates);
  const fetchWhatsappTemplates = useGlobalStore(state => state.fetchWhatsappTemplates);

  // Save draft to localStorage whenever data changes
  useEffect(() => {
    if (key === null) return; // if storage disabled
    const draft = {
      mobile,
      selectedTemplate,
      parameters,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(draft));
  }, [mobile, selectedTemplate, parameters, key]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        if (Array.isArray(whatsappTemplates) && whatsappTemplates.length > 0) {
          setTemplates(whatsappTemplates);
          return;
        }
        const data = await fetchWhatsappTemplates();
        if (mounted) setTemplates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        if (mounted) setTemplates([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [whatsappTemplates, fetchWhatsappTemplates]);

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

      const result = onSend({
        mobile: mobile.trim(),
        template: templateToSend,
      });

      if (result && typeof result.then === 'function') {
        await result;
      }

      if (key) {
        localStorage.removeItem(key);
        console.log('🗑️ Cleared WhatsAppTemplateSelector draft localStorage after successful send:', key);
      }
    } catch (error) {
      console.error('Failed to send template:', error);
      alert('Failed to send template');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    // Keep localStorage data - don't clear on cancel
    onCancel();
  };

  const applyFormatting = (formatType, inputElement = null) => {
    if (!focusedParamName) {
      if (!inputElement) {
        alert('Please select a parameter field first');
        return;
      }
    }

    const element = inputElement || document.querySelector(`input[data-param="${focusedParamName}"]`);
    if (!element) return;

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selectedText = element.value.substring(start, end);

    if (!selectedText) {
      alert('Please select text in the field to format');
      return;
    }

    let formattedText;
    if (formatType === 'bold') {
      // toggle: remove surrounding asterisks if already bold
      if (selectedText.startsWith('*') && selectedText.endsWith('*')) {
        formattedText = selectedText.slice(1, -1);
      } else {
        formattedText = `*${selectedText}*`;
      }
    } else if (formatType === 'italic') {
      // toggle: remove surrounding underscores if already italic
      if (selectedText.startsWith('_') && selectedText.endsWith('_')) {
        formattedText = selectedText.slice(1, -1);
      } else {
        formattedText = `_${selectedText}_`;
      }
    }

    const newValue = element.value.substring(0, start) + formattedText + element.value.substring(end);
    handleParameterChange(focusedParamName, newValue);

    // Restore focus to input
    setTimeout(() => element.focus(), 0);
  };

  const handleKeyDown = (e) => {
    // Ctrl+B for bold, Ctrl+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyFormatting('bold', e.target);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyFormatting('italic', e.target);
    }
  };

  const handlePaste = (e) => {
    // Prevent default paste behavior that can cause scroll jumps
    // The onChange handler will manage the state update
  };

  // Layout Styles
  const containerStyle = {
    display: 'flex',
    height: '100%',
    maxHeight: '100%',
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
    minHeight: 0,
    maxHeight: '100%',
  };

  const rightPanelStyle = {
    flex: '0 0 55%',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px',
    background: '#f8fafc',
    overflowY: 'auto',
    maxHeight: '100vh',
    minHeight: 0,
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

  const topControlsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '6px',
    flexShrink: 0,
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

  // Fixed section height for Parameters and Live Preview
  const sectionFixedHeight = '60vh';

  const previewStyle = {
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    // Use a fixed height so preview is always scrollable when content exceeds
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
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
    marginTop: '12px',
    justifyContent: 'flex-end',
    flexShrink: 0,
  };

  const parametersContainerStyle = {
    // Fixed height matching preview so both scroll independently
    height: sectionFixedHeight,
    overflowY: 'auto',
    minHeight: 0,
    paddingRight: '8px',
    marginBottom: '12px',
    paddingBottom: '8px',
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
    minWidth: '84px',
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

  const formattingButtonStyle = {
    padding: '8px 12px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'all 0.2s',
  };

  const formattingButtonsContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    alignItems: 'center',
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) {
      return (
        <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '40px' }}>
 
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
      if (!text) return null;

      // Split out code blocks first (```code```) and keep other text parts
      const codeRegex = /```([\s\S]*?)```/g;
      const segments = [];
      let lastIndex = 0;
      let match;
      while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'code', content: match[1] });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
      }

        // Helper to convert plain text (with URLs) into React nodes with clickable links
        const createNodesFromText = (inputStr, keyBase = 't') => {
          const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
          const nodes = [];
          let lastIndex = 0;
          let match;
          let idx = 0;
          while ((match = urlRegex.exec(inputStr)) !== null) {
            if (match.index > lastIndex) {
              nodes.push(<span key={`${keyBase}-${idx++}`}>{inputStr.slice(lastIndex, match.index)}</span>);
            }
            const raw = match[0];
            const href = raw.startsWith('http') ? raw : `http://${raw}`;
            nodes.push(
              <a key={`${keyBase}-a-${idx++}`} href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                {raw}
              </a>
            );
            lastIndex = urlRegex.lastIndex;
          }
          if (lastIndex < inputStr.length) nodes.push(<span key={`${keyBase}-${idx++}`}>{inputStr.slice(lastIndex)}</span>);
          return nodes;
        };

        // Helper to process inline formatting within non-code segments
        let keyCounter = 0;
        // parse a string with Whatsapp-style markers (*bold*, _italic_, ~strike~)
        // supports nesting by consuming the first matching pair of the same
        // delimiter and recursively processing the inner text.
        const processInline = (str) => {
          const nodes = [];
          let i = 0;
          while (i < str.length) {
            const ch = str[i];
            if (ch === '*' || ch === '_' || ch === '~') {
              const closing = str.indexOf(ch, i + 1);
              if (closing > -1) {
                // process text before this marker
                if (i > 0) {
                  nodes.push(...createNodesFromText(str.slice(0, i), `t-${keyCounter++}`));
                }
                const innerText = str.slice(i + 1, closing);
                const innerNodes = processInline(innerText);
                let element;
                if (ch === '*') element = <strong key={`s-${keyCounter++}`}>{innerNodes}</strong>;
                else if (ch === '_') element = <em key={`s-${keyCounter++}`}>{innerNodes}</em>;
                else if (ch === '~') element = <del key={`s-${keyCounter++}`}>{innerNodes}</del>;
                nodes.push(element);
                // continue parsing after the closing marker
                const rest = str.slice(closing + 1);
                if (rest.length) {
                  nodes.push(...processInline(rest));
                }
                return nodes;
              }
            }
            i += 1;
          }
          // no more markers, just plain text
          if (str.length) {
            nodes.push(...createNodesFromText(str, `t-${keyCounter++}`));
          }
          return nodes;
        };

      // Build final array of nodes preserving code blocks
      return segments.flatMap((seg) => {
        if (seg.type === 'code') {
          return (
            <code key={`code-${keyCounter++}`} style={{
              background: '#f1f5f9',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              display: 'block',
              whiteSpace: 'pre-wrap',
              marginBottom: '8px'
            }}>
              {seg.content}
            </code>
          );
        }
        // For text, preserve line breaks and inline formatting
        // split by lines to keep visual separation while returning inline-processed nodes
        const lines = seg.content.split(/\n/);
        return lines.flatMap((line, idx) => {
          const processed = processInline(line);
          // After each line except the last, add a <br /> to preserve newlines
          if (idx < lines.length - 1) {
            return [...processed, <br key={`br-${keyCounter++}`} />];
          }
          return processed;
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
                  background: '#000000',
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  alignSelf:'center',
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
          Loading WhatsApp Templates
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* LEFT PANEL */}
      <div style={leftPanelStyle}>
        {/* Top Controls: Mobile + Template Selection */}
        <div style={topControlsStyle}>
          <div>
            <label style={sectionTitleStyle}>Mobile Number</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onPaste={handlePaste}
              style={inputStyle}
            />
          </div>

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
              <option value="">-----Select-----</option>
              {templates
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Parameters Input (includes action buttons so they scroll together) */}
        {selectedTemplate && selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
          <div style={parametersContainerStyle}>
            <label style={sectionTitleStyle}>Parameters</label>

            {selectedTemplate.parameters.map((param) => (
              <div key={param.name} style={parameterRowStyle}>
                <label style={labelStyle}>{param.name}</label>
                <input
                  type="text"
                  style={inputStyle}
                  data-param={param.name}
                  value={parameters[param.name] || ''}
                  onChange={(e) => handleParameterChange(param.name, e.target.value)}
                  onFocus={() => setFocusedParamName(param.name)}
                  onBlur={() => setFocusedParamName(null)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={`Type text • Ctrl+B for bold • Ctrl+I for italic`}
                />
              </div>
            ))}

            {/* Action Buttons inside scrollable parameters container */}
            <div style={buttonContainerStyle}>
              <button style={cancelButtonStyle} onClick={handleCancel} disabled={sending}>
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
        )}

        {/* If selected template has no parameters, still show action buttons */}
        {selectedTemplate && (!selectedTemplate.parameters || selectedTemplate.parameters.length === 0) && (
          <div style={{ marginTop: '12px' }}>
            <div style={buttonContainerStyle}>
              <button style={cancelButtonStyle} onClick={handleCancel} disabled={sending}>
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
        )}
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
