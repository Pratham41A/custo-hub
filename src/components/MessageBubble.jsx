import React, { useState } from 'react';

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
// Accepts optional `isSent` flag so we can scope styles for incoming vs sent messages
const sanitizeAndFixHTML = (htmlString, isSent = false) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  
  try {
    // Normalize Outlook/MSO conditional comments and VML buttons so they render in browsers
    const transformOutlookHtml = (html) => {
      if (!html || typeof html !== 'string') return html;

      // 1) Unwrap conditional MSO comments so their inner content is preserved
      //    e.g. <!--[if mso]>...<![endif]-->  => ...
      html = html.replace(/<!--[if[^\]]*\]>([\s\S]*?)<!\[endif\]-->/gi, '$1');

      // 2) Convert common VML button patterns (<v:roundrect>...</v:roundrect>) to regular anchors
      //    We try to preserve href and inner text.
      html = html.replace(/<v:roundrect([\s\S]*?)>([\s\S]*?)<\/v:roundrect>/gi, (match, attrs, inner) => {
        // find href attribute if present
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '#';

        // Strip any nested <v:*> tags and keep inner text/html
        // Create a temporary div to extract text if necessary
        try {
          const tmp = document.createElement('div');
          tmp.innerHTML = inner;
          // If there's an <a> inside, use its href
          const a = tmp.querySelector('a');
          const finalHref = a && a.getAttribute('href') ? a.getAttribute('href') : href;
          // Get cleaned inner HTML/text
          const display = tmp.textContent && tmp.textContent.trim() ? tmp.innerHTML : inner;
          return `<a href="${finalHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 14px;border-radius:3px;background:#ff9900;color:#ffffff;text-decoration:none;font-weight:600;font-size:12px;">${display}</a>`;
        } catch (e) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 14px;border-radius:3px;background:#ff9900;color:#ffffff;text-decoration:none;font-weight:600;font-size:12px;">${inner}</a>`;
        }
      });

      // 2b) Convert common VML image patterns (<v:imagedata> or inside <v:shape>) to <img>
      html = html.replace(/<v:imagedata[^>]*src=["']([^"']+)["'][^>]*\/?\s*>/gi, (match, src) => {
        return `<img src="${src}" alt="" />`;
      });

      html = html.replace(/<v:shape[\s\S]*?>([\s\S]*?)<\/v:shape>/gi, (match, inner) => {
        const srcMatch = inner.match(/<v:imagedata[^>]*src=["']([^"']+)["']/i);
        if (srcMatch) return `<img src="${srcMatch[1]}" alt="" />`;
        return inner;
      });

      // 3) Convert common pattern where an <a> wraps a <button> (many mailers produce this)
      //    e.g. <a href="..."><button style="...">Reply</button></a> => <a href="..." style="...">Reply</a>
      html = html.replace(/<a([^>]*)>\s*<button([^>]*)>([\s\S]*?)<\/button>\s*<\/a>/gi, (match, aAttrs, btnAttrs, inner) => {
        const hrefMatch = aAttrs.match(/href=["']([^"']+)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '#';
        const aStyleMatch = aAttrs.match(/style=["']([^"']*)["']/i);
        const btnStyleMatch = btnAttrs.match(/style=["']([^"']*)["']/i);
        const defaultBtnStyle = 'display:inline-block;padding:7px 14px;background:#ff9900;color:#ffffff;border:none;border-radius:3px;text-decoration:none;font-weight:600;font-family:inherit;font-size:12px;';
        const combinedStyle = `${aStyleMatch ? aStyleMatch[1] + ';' : ''}${btnStyleMatch ? btnStyleMatch[1] + ';' : ''}${defaultBtnStyle}`;
        try {
          const tmp = document.createElement('div');
          tmp.innerHTML = inner;
          const display = tmp.textContent && tmp.textContent.trim() ? tmp.innerHTML : inner;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${combinedStyle}">${display}</a>`;
        } catch (e) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${combinedStyle}">${inner}</a>`;
        }
      });

      // 4) Convert standalone <button> tags to anchors (no href available)
      html = html.replace(/<button([^>]*)>([\s\S]*?)<\/button>/gi, (match, btnAttrs, inner) => {
        const btnStyleMatch = btnAttrs.match(/style=["']([^"']*)["']/i);
        const defaultBtnStyle = 'display:inline-block;padding:7px 14px;background:#ff9900;color:#ffffff;border:none;border-radius:3px;text-decoration:none;font-weight:600;font-family:inherit;font-size:12px;';
        const combinedStyle = `${btnStyleMatch ? btnStyleMatch[1] + ';' : ''}${defaultBtnStyle}`;
        try {
          const tmp = document.createElement('div');
          tmp.innerHTML = inner;
          const display = tmp.textContent && tmp.textContent.trim() ? tmp.innerHTML : inner;
          return `<a href="#" style="${combinedStyle}">${display}</a>`;
        } catch (e) {
          return `<a href="#" style="${combinedStyle}">${inner}</a>`;
        }
      });

      return html;
    };

    // Apply Outlook-specific transformations first
    htmlString = transformOutlookHtml(htmlString);
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
    // Remove stray lone closing-brace lines that sometimes appear inside Outlook fragments
    let inner = temp.innerHTML.replace(/^\s*\}\s*$/gm, '');
    // Also remove isolated stray braces adjacent to tags
    inner = inner.replace(/>\s*\}/g, '>').replace(/\}\s*</g, '<');

    // Normalize table width attributes so legacy fixed-width email templates don't overflow
    try {
      inner = inner.replace(/<table\b([^>]*)\bwidth=(?:['"])?\d+[^>]*>/gi, (m) => m.replace(/width=(?:['"])?\d+[^>\s]*/i, 'width="100%"'));
      // Remove style-based fixed pixel widths on tables
      inner = inner.replace(/(<table\b[^>]*style=["'][^"']*)width:\s*\d+px;?([^"']*["'][^>]*>)/gi, (m, p1, p2) => `${p1}${p2}`);
    } catch (e) {
      // ignore if regex fails for some odd HTML
    }
    // Wrap sanitized content with a lightweight email-content scope and helpful CSS
    const style = `
      <style>
        /* Basic reset and box sizing */
        .email-content, .email-content * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; }
        .email-content { width:100% !important; max-width:100% !important; overflow-wrap:break-word !important; -webkit-font-smoothing:antialiased !important; }

        /* Images and media */
        .email-content img{max-width:100%!important;height:auto!important;display:block!important;margin:6px 0;border:0!important}
        .email-content picture, .email-content video, .email-content iframe { max-width:100%!important; }

        /* Tables: center and make responsive where possible */
        .email-content table{max-width:100%!important;width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;margin:0 auto!important}
        .email-content table[width]{width:100% !important}
        .email-content td, .email-content th{word-break:break-word!important;vertical-align:top!important;padding:4px 8px!important}

        /* Headings and paragraphs */
        .email-content p, .email-content div, .email-content span { margin:0 0 8px!important; line-height:1.35!important }
        .email-content h1, .email-content h2, .email-content h3, .email-content h4, .email-content h5, .email-content h6 { margin:0 0 8px!important; line-height:1.2!important }

        /* Reset common Outlook/Mso classes */
        .ExternalClass, .ExternalClass * { line-height:100% !important; }
        .MsoNormal, .MsoNormal p { margin:0 !important }

        /* Links/buttons normalization */
        .email-content a{word-break:break-word!important;color:inherit!important;text-decoration:underline!important}
        .email-content a, .email-content button, .email-content .btn, .email-content a[role=button] {
          display: inline-block !important;
          min-width: 90px !important;
          max-width: 100% !important;
          height: auto !important;
          padding: 8px 14px !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          text-align: center !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          text-decoration: none !important;
          overflow: hidden !important;
          margin: 8px 0 !important;
        }

        /* Images inside buttons */
        .email-content a img, .email-content button img, .email-content .btn img { max-height:28px!important;height:auto!important;width:auto!important;display:inline-block!important;margin-right:8px!important }

        /* Incoming message specific button sizing: center and avoid wrapping; use inline-block rather than block to keep layout stable */
        .email-content.incoming a, .email-content.incoming button, .email-content.incoming .btn, .email-content.incoming a[role=button] {
          min-width: 120px !important;
          min-height: 40px !important;
          padding: 10px 18px !important;
          font-size: 14px !important;
          display: inline-block !important;
          white-space: nowrap !important;
          margin: 10px auto !important;
        }

        /* Prevent very long words or strings from breaking layout */
        .email-content { word-break: break-word !important; overflow-wrap: break-word !important }

        /* Allow very wide legacy templates to scroll horizontally inside their cell rather than break layout */
        .email-content .email-scroll { overflow:auto; -webkit-overflow-scrolling:touch; }

        /* Center table-cell children anchors */
        .email-content td > a, .email-content th > a { display:inline-block!important;margin:8px auto!important }
      </style>`;
    const wrapperClass = isSent ? 'email-content sent' : 'email-content incoming';
    return `${style}<div class="${wrapperClass}" style="font-size:12px;line-height:1.4;color:inherit">${inner}</div>`;
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

// Helper to convert plain text containing URLs into React nodes (clickable links)
const createLinkifiedNodes = (text, keyBase = 'l') => {
  if (!text || typeof text !== 'string') return [text];
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let idx = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`${keyBase}-${idx++}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    const raw = match[0];
    const href = raw.startsWith('http') ? raw : `http://${raw}`;
    nodes.push(
      <a key={`${keyBase}-a-${idx++}`} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
        {raw}
      </a>
    );
    lastIndex = urlRegex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(<span key={`${keyBase}-${idx++}`}>{text.slice(lastIndex)}</span>);
  return nodes;
};

function MessageBubble({ 
  msg, 
  onReply, 
  isStarted, 
  allMessages, 
  onScrollToMessage,
  onUpdateMessage,
  onRequestResolveMessage,
  inboxId
}) {
  const [showReplyPreview, setShowReplyPreview] = useState(false);
  // Local optimistic status so UI updates immediately on button clicks
  const [localStatus, setLocalStatus] = useState(null);

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
  const effectiveStatus = localStatus ?? msg.status;

  // Bubble styling based on isSent
  const bubbleStyle = {
    maxWidth: '70%',
    marginBottom: '16px',
    marginLeft: isSent ? 'auto' : 0,
    padding: '16px',
    borderRadius: '16px',
    background:  '#fff',
    color: isSent ? '#0f172a' : '#0f172a',
    boxShadow: isSent 
      ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
      : '0 2px 8px rgba(0,0,0,0.08)',
    wordBreak: 'break-word',
  };

  // Base style used for action buttons to ensure adaptive sizing and prevent overlap
  const actionBtnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    flex: '0 0 auto',
  };

  // Reply quote styling
  const replyQuoteStyle = {
    padding: '10px',
    marginBottom: '10px',
    borderLeft: `3px solid ${isSent ? '#c7c7c7' : '#4f46e5'}`,
    background: isSent ? '#f8fafc' : 'rgba(79,70,229,0.04)',
    borderRadius: '8px',
    fontSize: '12px',
    color: isSent ? '#111827' : '#374151',
    opacity: 0.95,
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
      const sanitizedHTML = sanitizeAndFixHTML(contentValue, isSent);
      return (
        <div
          style={{ fontSize: '12px', wordBreak: 'break-word' }}
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
                padding: '3px 6px', 
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '11px'
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
            return createLinkifiedNodes(subPart, `r-${partIdx}-${idx}`);
          });
        });
      };
      return (
        <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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

    // Gather parameters from several possible locations (template.parameters, msg.parameters, etc.)
    const paramSources = [];
    if (Array.isArray(template.parameters)) paramSources.push(...template.parameters);
    if (Array.isArray(msg?.parameters)) paramSources.push(...msg.parameters);
    if (Array.isArray(msg?.templateParameters)) paramSources.push(...msg.templateParameters);
    if (Array.isArray(msg?.template_parameters)) paramSources.push(...msg.template_parameters);

    // Normalize into map by name for quick lookup
    const paramMap = {};
    paramSources.forEach(p => {
      if (!p) return;
      const name = p.name || p.key || p.placeholder || '';
      const value = p.value ?? p.text ?? p.payload ?? '';
      if (name) paramMap[name] = value;
    });

    // If template has components parameters embedded, also include them
    if (Array.isArray(template.parameters)) {
      template.parameters.forEach(p => {
        const name = p.name || p.key || '';
        const value = p.value ?? p.text ?? '';
        if (name) paramMap[name] = value;
      });
    }

    // Replace placeholders using several common placeholder formats
    Object.keys(paramMap).forEach((rawName) => {
      const value = paramMap[rawName] ?? '';
      if (value === undefined || value === null) return;

      // Normalize key by stripping surrounding braces and whitespace
      const normalized = String(rawName).replace(/^\s*\{+|\}+\s*$/g, '').trim();

      // Build regex patterns to match common placeholder styles robustly
      const patterns = [
        // exact double-brace with optional spaces: {{ key }}
        new RegExp(`\\{\\{\\s*${normalized.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g'),
        // single brace: {key}
        new RegExp(`\\{\\s*${normalized.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\}`, 'g'),
        // plain key (word or number) - match as whole word
        new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'g')
      ];

      patterns.forEach((rx) => {
        try {
          bodyText = bodyText.replace(rx, value);
        } catch (e) {
          // ignore
        }
      });
    });

    // Reuse formatting logic from WhatsApp preview: handle code blocks and inline styles
    const formatWhatsAppText = (text, fontSize = '13px') => {
      if (!text) return null;
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
      if (lastIndex < text.length) segments.push({ type: 'text', content: text.slice(lastIndex) });

      let keyCounter = 0;
      const processInline = (str) => {
        const nodes = [];
        const inlineRegex = /(\*(.*?)\*)|(_(.*?)_)|(~(.*?)~)/g;
        let last = 0;
        let m;
        while ((m = inlineRegex.exec(str)) !== null) {
          if (m.index > last) nodes.push(...createLinkifiedNodes(str.slice(last, m.index), `s-${keyCounter++}`));
          const full = m[0];
          const inner = m[2] ?? m[4] ?? m[6] ?? '';
          if (full.startsWith('*')) nodes.push(<strong key={keyCounter++}>{inner}</strong>);
          else if (full.startsWith('_')) nodes.push(<em key={keyCounter++}>{inner}</em>);
          else if (full.startsWith('~')) nodes.push(<del key={keyCounter++}>{inner}</del>);
          last = m.index + full.length;
        }
        if (last < str.length) nodes.push(...createLinkifiedNodes(str.slice(last), `s-${keyCounter++}`));
        return nodes;
      };

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
        const lines = seg.content.split(/\n/);
        return lines.flatMap((line, idx) => {
          const processed = processInline(line);
          if (idx < lines.length - 1) return [...processed, <br key={`br-${keyCounter++}`} />];
          return processed;
        });
      });
    };

    return (
      <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>
        {/* Body Text */}
        {bodyComponent && (
          <div style={{ marginBottom: '12px', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.5' }}>
            {formatWhatsAppText(bodyText)}
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
                  ...actionBtnBase,
                  display: 'inline-flex',
                  padding: '8px 12px',
                  background: isSent ? 'rgba(255,255,255,0.08)' : '#111827',
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  border: `1px solid ${isSent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
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
      const sanitizedHTML = sanitizeAndFixHTML(contentValue, isSent);
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
              return createLinkifiedNodes(part, `cs-${idx}`);
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
          <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit' }}>
            <span style={{ fontSize: '13px', opacity: 0.9 }}>⤴</span>
            <span style={{ fontSize: '13px', opacity: 0.95 }}>In reply to</span>
          </div>
          <div style={{ 
            fontSize: '12px',
            opacity: 0.9,
            maxWidth: '100%',
            fontStyle: 'italic',
            color: 'inherit'
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
              isSent ? '#8a7e7e' : '#8a7e7e'
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

      {/* Conditional Action Buttons - Email only */}
      {msg.source === 'email' && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${isSent ? 'rgba(255,255,255,0.2)' : 'rgba(99, 102, 241, 0.1)'}` }}>
          {effectiveStatus === 'resolved' ? (
            // Resolved: show labeled fields for clarity
            <div style={{ padding: '10px', borderRadius: '8px', background: isSent ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${isSent ? 'rgba(255,255,255,0.06)' : '#e6eef8'}`, color: isSent ? 'rgba(255,255,255,0.95)' : '#0f172a' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, minWidth: '90px' }}>Status:</div>
                <div style={{ fontSize: '12px' }}>Resolved</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, minWidth: '90px' }}>Query Type:</div>
                <div style={{ fontSize: '12px', color: isSent ? 'rgba(255,255,255,0.9)' : '#374151' }}>{msg.queryType || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, minWidth: '90px' }}>Resolved by:</div>
                <div style={{ fontSize: '12px', color: isSent ? 'rgba(255,255,255,0.9)' : '#374151' }}>{msg.resolvedBy || '—'}</div>
              </div>
            </div>
          ) : (
            // Unread or Read: action buttons with icons
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {effectiveStatus === 'unread' && onUpdateMessage && (
                <>
                  <button
                    title="Mark as read"
                    onClick={() => {
                      setLocalStatus('read');
                      onUpdateMessage(inboxId, msg._id, 'read');
                    }}
                      style={{
                        ...actionBtnBase,
                        gap: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: `1px solid ${isSent ? 'rgba(255,255,255,0.12)' : '#e6eaf2'}`,
                        borderRadius: '8px',
                        background: isSent ? 'rgba(255,255,255,0.06)' : '#ffffff',
                        color: isSent ? '#fff' : '#111827',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isSent ? 'rgba(255,255,255,0.09)' : '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSent ? 'rgba(255,255,255,0.06)' : '#ffffff'; }}
                  >
                    <span>👁</span> Read
                  </button>
                  <button
                    title="Ignore this message"
                    onClick={() => {
                      setLocalStatus('ignore');
                      onUpdateMessage(inboxId, msg._id, 'ignore');
                    }}
                    style={{
                      ...actionBtnBase,
                      gap: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: `1px solid ${isSent ? 'rgba(244,67,54,0.16)' : '#fcd34d'}`,
                      borderRadius: '8px',
                      background: isSent ? 'rgba(244,67,54,0.12)' : '#fff7ed',
                      color: isSent ? '#fff' : '#92400e',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isSent ? 'rgba(244,67,54,0.18)' : '#fde68a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSent ? 'rgba(244,67,54,0.12)' : '#fff7ed'; }}
                  >
                    <span>⏭</span> Skip
                  </button>
                </>
              )}
              {effectiveStatus === 'read' && onUpdateMessage && (
                <>
                  <button
                    title="Mark as unread"
                    onClick={() => {
                      setLocalStatus('unread');
                      onUpdateMessage(inboxId, msg._id, 'unread');
                    }}
                      style={{
                        ...actionBtnBase,
                        gap: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: `1px solid ${isSent ? 'rgba(255,255,255,0.12)' : '#e6eaf2'}`,
                        borderRadius: '8px',
                        background: isSent ? 'rgba(255,255,255,0.06)' : '#f8f7ff',
                        color: isSent ? '#fff' : '#4f46e5',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isSent ? 'rgba(255,255,255,0.09)' : '#f0eeff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSent ? 'rgba(255,255,255,0.06)' : '#f8f7ff'; }}
                  >
                    <span>📖</span> Unread
                  </button>
                  <button
                    title="Mark as resolved"
                    onClick={() => {
                      // Open resolve modal for message if provided
                      if (typeof onRequestResolveMessage === 'function') {
                        onRequestResolveMessage(msg);
                        return;
                      }
                      setLocalStatus('resolved');
                      onUpdateMessage(inboxId, msg._id, 'resolved');
                    }}
                    style={{
                      ...actionBtnBase,
                      gap: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: `1px solid ${isSent ? 'rgba(34,197,94,0.16)' : '#bbf7d0'}`,
                      borderRadius: '8px',
                      background: isSent ? 'rgba(34,197,94,0.12)' : '#ecfdf5',
                      color: isSent ? '#fff' : '#059669',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isSent ? 'rgba(34,197,94,0.18)' : '#bbf7d0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSent ? 'rgba(34,197,94,0.12)' : '#ecfdf5'; }}
                  >
                    <span>✅</span> Resolve
                  </button>
                </>
              )}
            </div>
          )}
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

const propsAreEqual = (prevProps, nextProps) => {
  // Prefer to re-render only when the message content or status changes or when inbox selection changes
  const p = prevProps.msg || {};
  const n = nextProps.msg || {};
  if (p._id !== n._id) return false;
  if (p.status !== n.status) return false;
  if ((p.body || p.text || p.content) !== (n.body || n.text || n.content)) return false;
  if ((p.html || p.htmlContent) !== (n.html || n.htmlContent)) return false;
  if ((p.updatedAt || '') !== (n.updatedAt || '')) return false;
  // ignore handler reference changes; assume visual-only updates handled locally
  return true;
};

export default React.memo(MessageBubble, propsAreEqual);
