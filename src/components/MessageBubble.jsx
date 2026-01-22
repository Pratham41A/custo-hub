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
  const isSent = msg.isSent || msg.from === 'Support' || msg.direction === 'outbound';

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
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {repliedMessage.body || repliedMessage.text || repliedMessage.subject || 'No content'}
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
    justifyContent: 'center',   // horizontal center
    alignItems: 'center',       // vertical center
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
      
      {/* Render htmlBody as HTML or body as plain text */}
      {msg.htmlBody ? (
        <div
          style={{ fontSize: '14px', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: msg.htmlBody }}
        />
      ) : msg.body || msg.text ? (
        <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.body || msg.text}
        </div>
      ) : msg.template ? (
        <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: 'italic', opacity: 0.9 }}>
          <span style={{ fontWeight: 600 }}>Template:</span> {msg.template}
        </div>
      ) : null}

      {/* Attachments Display */}
      {msg.attachments && msg.attachments.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {msg.attachments.map((attachment, idx) => (
              <a
                key={idx}
                href={attachment.url || attachment}
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
        {!isSent && isStarted && onReply && (
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
