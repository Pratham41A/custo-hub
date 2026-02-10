import { useState } from 'react';

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

// HTML Sanitization & Fixing Function
const sanitizeAndFixHTML = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  
  try {
    // Create a temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    
    // Function to recursively remove dangerous elements and attributes
    const sanitizeNode = (node) => {
      if (node.nodeType === 3) return; // Text node - safe
      if (node.nodeType === 8) {
        node.remove(); // Remove comments
        return;
      }
      
      // List of dangerous tags
      const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
      if (dangerousTags.includes(node.tagName?.toLowerCase())) {
        node.remove();
        return;
      }
      
      // Remove dangerous attributes
      const dangerousAttrs = ['onload', 'onerror', 'onmouseover', 'onclick', 'onchange', 'onfocus', 'onblur', 'ondblclick', 'onkeydown', 'onkeyup'];
      const attrs = Array.from(node.attributes || []);
      attrs.forEach(attr => {
        if (dangerousAttrs.some(dangerous => attr.name.toLowerCase().startsWith(dangerous))) {
          node.removeAttribute(attr.name);
        }
      });
      
      // Recursively sanitize children
      Array.from(node.children || []).forEach(child => sanitizeNode(child));
    };
    
    sanitizeNode(temp);
    return temp.innerHTML;
  } catch (error) {
    console.error('HTML Sanitization error:', error);
    // If sanitization fails, return escaped text
    return htmlString.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

// Get source icon/image URL
const getSourceImage = (source) => {
  if (source === 'email') {
    return 'https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Email.png';
  } else if (source === 'whatsapp') {
    return 'https://s3.ap-south-1.amazonaws.com/cdn2.onference.in/Whatsapp.png';
  }
  return null;
};

export function MessageBubble({ msg, onReply, isStarted, allMessages, onScrollToMessage }) {
  const [showReplyPreview, setShowReplyPreview] = useState(false);

  // Determine if message was sent by user/agent
  const isSent = msg.isSent === true;

  // Get the replied message if inReplyTo exists
  const getRepliedMessage = () => {
    if (!msg.inReplyTo) return null;
    // inReplyTo can be an ID or full object
    if (typeof msg.inReplyTo === 'string') {
      return allMessages?.find(m => m._id === msg.inReplyTo);
    }
    return msg.inReplyTo;
  };

  const repliedMessage = getRepliedMessage();

  // Bubble styling based on isSent
  const bubbleStyle = {
    maxWidth: '70%',
    marginBottom: '16px',
    marginLeft: isSent ? 'auto' : 0,
    padding: '16px',
    borderRadius: '16px',
    background: isSent ? '#6366f1' : '#fff',
    color: isSent ? '#fff' : '#0f172a',
    boxShadow: isSent 
      ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
      : '0 2px 8px rgba(0,0,0,0.08)',
    wordBreak: 'break-word',
  };

  // Reply quote styling
  const replyQuoteStyle = {
    padding: '12px',
    marginBottom: '12px',
    borderLeft: `3px solid ${isSent ? 'rgba(255,255,255,0.4)' : '#6366f1'}`,
    background: isSent ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.05)',
    borderRadius: '4px',
    fontSize: '13px',
    opacity: 0.85,
  };

  // Render formatted content based on contentType
  const renderFormattedContent = (content, contentType = 'normal') => {
    if (!content) return null;

    let contentValue = '';
    if (typeof content === 'object' && content.value !== undefined) {
      contentValue = content.value;
    } else {
      contentValue = content;
    }

    if (!contentValue) return null;

    // Handle special case: template object
    if (contentType === 'special' && typeof contentValue === 'object' && contentValue.components) {
      return renderWhatsAppTemplate(contentValue);
    }

    if (contentType === 'html') {
      const sanitizedHTML = sanitizeAndFixHTML(contentValue);
      return (
        <div
          style={{ fontSize: '13px', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }

    if (contentType === 'special') {
      // WhatsApp formatting: *bold*, _italic_, ~strikethrough~, ```monospace```
      const formatText = (text) => {
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
        <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {formatText(contentValue)}
        </div>
      );
    }

    // Normal text
    return (
      <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {contentValue}
      </div>
    );
  };

  // Render WhatsApp Template
  const renderWhatsAppTemplate = (template) => {
    if (!template || !template.components) return null;

    const bodyComponent = template.components.find(c => c.type === 'body');
    const buttonComponents = template.components.filter(c => c.type === 'url');

    // Replace placeholders in body text with parameter values
    let bodyText = bodyComponent?.text || '';
    if (template.parameters && Array.isArray(template.parameters)) {
      template.parameters.forEach(param => {
        if (param.name && param.value) {
          const escapedPlaceholder = param.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          bodyText = bodyText.replace(new RegExp(escapedPlaceholder, 'g'), param.value);
        }
      });
    }

    return (
      <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>
        {/* Body Text */}
        {bodyComponent && (
          <div style={{ marginBottom: '12px', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.5' }}>
            {bodyText}
          </div>
        )}

        {/* Buttons */}
        {buttonComponents && buttonComponents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {buttonComponents.map((btn, idx) => (
              <a
                key={idx}
                href={btn.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  background: isSent ? 'rgba(255,255,255,0.2)' : '#6366f1',
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${isSent ? 'rgba(255,255,255,0.3)' : 'rgba(99, 102, 241, 0.5)'}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(0)';
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

  // Render content based on contentType
  const renderContent = () => {
    // Handle msg.content as object with value field
    let contentValue = '';
    let contentType = msg.contentType || 'normal';

    if (msg.content && typeof msg.content === 'object') {
      if (msg.content.value !== undefined) {
        contentValue = msg.content.value;
      }
    } else if (typeof msg.content === 'string') {
      contentValue = msg.content;
    }

    // Fallback to legacy fields
    if (!contentValue) {
      contentValue = msg.body || msg.text || '';
    }

    if (!contentValue) return null;

    // Special case: contentType is 'special' and value is an object (WhatsApp template)
    if (contentType === 'special' && typeof contentValue === 'object' && contentValue.components) {
      return renderWhatsAppTemplate(contentValue);
    }

    if (contentType === 'html') {
      const sanitizedHTML = sanitizeAndFixHTML(contentValue);
      return (
        <div
          style={{ fontSize: '14px', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }

    if (contentType === 'special') {
      // WhatsApp formatting: *bold*, _italic_, ~strikethrough~
      const formatSpecialText = (text) => {
        return (
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {text.split(/\*(.*?)\*|_(.*?)_|~(.*?)~/g).map((part, idx) => {
              if (idx % 4 === 1) return <strong key={idx}>{part}</strong>;
              if (idx % 4 === 2) return <em key={idx}>{part}</em>;
              if (idx % 4 === 3) return <del key={idx}>{part}</del>;
              return <span key={idx}>{part}</span>;
            })}
          </div>
        );
      };
      return formatSpecialText(contentValue);
    }

    // Normal text
    return (
      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {contentValue}
      </div>
    );
  };

  return (
    <div style={bubbleStyle}>
      {/* Source Image */}
      {getSourceImage(msg.source) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.7 }}>
          <img 
            src={getSourceImage(msg.source)} 
            alt={msg.source} 
            style={{ width: '16px', height: '16px' }}
          />
          <span style={{ fontSize: '11px', textTransform: 'capitalize', fontWeight: 500 }}>
            {msg.source}
          </span>
        </div>
      )}
      {/* Reply Quote - Display replied message above current message */}
      {repliedMessage && (
        <div
          style={{
            ...replyQuoteStyle,
            cursor: onScrollToMessage ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          onClick={() => onScrollToMessage && onScrollToMessage(repliedMessage._id)}
          onMouseEnter={() => {
            setShowReplyPreview(true);
            if (onScrollToMessage) {
              document.body.style.cursor = 'pointer';
            }
          }}
          onMouseLeave={() => {
            setShowReplyPreview(false);
            if (onScrollToMessage) {
              document.body.style.cursor = 'auto';
            }
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⤴</span>
            <span>In reply to:</span>
          </div>
          <div style={{ 
            fontSize: '12px',
            opacity: 0.9,
            maxWidth: '100%'
          }}>
            {renderFormattedContent(
              repliedMessage.content || repliedMessage.body || repliedMessage.text,
              repliedMessage.contentType || 'normal'
            ) || (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {repliedMessage.subject || 'No content'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Message Content */}
      {msg.subject && (
        <div
          style={{
            marginBottom: '12px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            borderBottom: `2px solid ${
              isSent ? 'rgba(255,255,255,0.3)' : 'rgba(99, 102, 241, 0.3)'
            }`,
            paddingBottom: '8px',
            textAlign: 'center',
          }}
        >
          {msg.subject}
        </div>
      )}

      {/* Render content based on contentType */}
      {renderContent()}

      {/* Template display if present */}
      {msg.template && (
        <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: 'italic', opacity: 0.9 }}>
          <span style={{ fontWeight: 600 }}>Template:</span> {msg.template}
        </div>
      )}

      {/* Attachments Display */}
      {msg.attachments && msg.attachments.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {msg.attachments.filter(a => a).map((attachment, idx) => (
              <a
                key={idx}
                href={attachment?.url || attachment}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: isSent ? '#fff' : '#6366f1',
                  textDecoration: 'underline',
                  wordBreak: 'break-word',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.9'}
              >
                {typeof attachment === 'string' 
                  ? attachment.split('/').pop() 
                  : attachment.name || `Attachment ${idx + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer with timestamp and reply button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', opacity: 0.7 }}>
          {formatDate(msg.messageDateTime || msg.createdAt)}
        </span>
        {!isSent && onReply && (
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: isSent ? '#fff' : '#6366f1',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'opacity 0.2s',
            }}
            onClick={() => onReply(msg._id)}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            title="Reply to this message"
          >
            ⤴
          </button>
        )}
      </div>
    </div>
  );
}
