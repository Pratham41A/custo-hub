import { WhatsAppTemplateSelector } from './WhatsAppTemplateSelector';

export function WhatsAppEditor({ onSend, onCancel, isReply = false, recipientMobile = '', isTemplateExpired = false }) {
  // WhatsApp now only supports template mode
  // If 24-hour conversation window has passed, show template selector directly
  return (
    <WhatsAppTemplateSelector
      onSend={onSend}
      onCancel={onCancel}
      recipientMobile={recipientMobile}
    />
  );
}
