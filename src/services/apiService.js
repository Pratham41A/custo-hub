const BASE_URL = 'https://sadmin-api.onference.in';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Dashboard - GET /support/dashboards
  async getDashboards() {
    return this.request('/support/dashboards');
  }

  // Inboxes - POST /support/inboxes
  async getInboxes({ status = '', limit = 20, skip = 0, startDate = '', endDate = '' } = {}) {
    return this.request('/support/inboxes', {
      method: 'POST',
      body: { status, limit, skip, startDate, endDate },
    });
  }

  // Update Inbox - POST /support/inbox
  async updateInbox({ inboxId, type, queryTypes = '', status = '', preview = '' }) {
    return this.request('/support/inbox', {
      method: 'POST',
      body: { inboxId, type, query_types: queryTypes, status, preview },
    });
  }

  // Messages - POST /support/messages
  async getMessages(inboxId) {
    return this.request('/support/messages', {
      method: 'POST',
      body: { inboxId },
    });
  }

  // WhatsApp - POST /support/whatsapp/template
  async sendWhatsappTemplate(mobile, template) {
    return this.request('/support/whatsapp/template', {
      method: 'POST',
      body: { mobile, template },
    });
  }

  // WhatsApp - POST /support/whatsapp/new
  async sendWhatsappMessage(mobile, body) {
    return this.request('/support/whatsapp/new', {
      method: 'POST',
      body: { mobile, body },
    });
  }

  // Outlook Reply - POST /support/outlook/reply
  async sendEmailReply(replyMessageId, body, email) {
    return this.request('/support/outlook/reply', {
      method: 'POST',
      body: { replyMessageId, body, email },
    });
  }

  // Outlook New - POST /support/outlook/new
  async sendNewEmail(subject, body, email) {
    return this.request('/support/outlook/new', {
      method: 'POST',
      body: { subject, body, email },
    });
  }

  // Subscriptions - POST /support/subscriptions
  async getSubscriptions(userid, limit = 10) {
    return this.request('/support/subscriptions', {
      method: 'POST',
      body: { userid, limit },
    });
  }

  // Payments - POST /support/payments
  async getPayments(userid, limit = 10) {
    return this.request('/support/payments', {
      method: 'POST',
      body: { userid, limit },
    });
  }

  // Views - POST /support/views
  async getViews(userid, limit = 10) {
    return this.request('/support/views', {
      method: 'POST',
      body: { userid, limit },
    });
  }

  // Activities/Notes - POST /support/activities
  async getActivities(userid, limit = 10) {
    return this.request('/support/activities', {
      method: 'POST',
      body: { userid, limit },
    });
  }

  // Create Activity/Note - POST /support/activity
  async createActivity(owner, body, dueDate) {
    return this.request('/support/activity', {
      method: 'POST',
      body: { owner, body, due_date: dueDate },
    });
  }
}

export const apiService = new ApiService();
