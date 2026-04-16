import { useState } from 'react';
import { apiService } from '../services/apiService';
import { useGlobalStore } from '../store/globalStore';

export function ForwardEmailModal({ message, onClose, onSuccess }) {
  const [toRecipients, setToRecipients] = useState('');
  const [ccRecipients, setCcRecipients] = useState('');
  const [bccRecipients, setBccRecipients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useGlobalStore(state => state.showToast);

  const handleSend = async () => {
    // Validation
    if (!toRecipients.trim()) {
      showToast('Please enter at least one recipient in TO field', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.forwardEmail(
        message.messageId,
        toRecipients.trim(),
        ccRecipients.trim(),
        bccRecipients.trim()
      );

      showToast('Email forwarded successfully!', 'success');
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Forward error:', error);
      showToast(error.message || 'Failed to forward email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Forward Email
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <div
            style={{
              padding: '24px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {/* TO Recipients */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#111827',
                }}
              >
                To <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={toRecipients}
                onChange={(e) => setToRecipients(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="recipient@example.com or multiple (comma-separated)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Separate multiple addresses with commas
              </div>
            </div>

            {/* CC Recipients */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#111827',
                }}
              >
                Cc
              </label>
              <input
                type="text"
                value={ccRecipients}
                onChange={(e) => setCcRecipients(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="cc@example.com (optional)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Separate multiple addresses with commas
              </div>
            </div>

            {/* BCC Recipients */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#111827',
                }}
              >
                Bcc
              </label>
              <input
                type="text"
                value={bccRecipients}
                onChange={(e) => setBccRecipients(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="bcc@example.com (optional)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Separate multiple addresses with commas
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#1e40af',
                lineHeight: '1.5',
              }}
            >
              <strong>Note:</strong> The original email and its attachments will be forwarded to the specified recipients.
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              backgroundColor: '#f9fafb',
            }}
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#111827',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#fff';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#4338ca';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4f46e5';
              }}
            >
              {isLoading ? 'Forwarding...' : 'Forward'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
