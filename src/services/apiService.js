const BASE_URL = 'https://customer-support-v5v9.onrender.com';

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

  // Dashboard - GET /dashboards
  async getDashboards() {
    return this.request('/dashboards');
  }

  // Inboxes - GET /inboxes/:status (pass empty string or omit for all)
  async getInboxes({ status = '', limit = 20, skip = 0, startDate = '', endDate = '' } = {}) {
    const endpoint = status ? `/inboxes/${status}` : '/inboxes';
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Update Inbox - PATCH /inbox/:inboxId
  async updateInbox({ inboxId, status, queryType = '' }) {
    return this.request(`/inbox/${inboxId}`, {
      method: 'PATCH',
      body: { inboxId, status, queryType },
    });
  }

  // Messages - GET /messages/:inboxId
  async getMessages(inboxId) {
    return this.request(`/messages/${inboxId}`);
  }

  // WhatsApp - POST /whatsapp/template
  async sendWhatsappTemplate(mobile, template) {
    return this.request('/whatsapp/template', {
      method: 'POST',
      body: { mobile, template },
    });
  }

  // WhatsApp - POST /whatsapp/new
  async sendWhatsappMessage(mobile, body) {
    return this.request('/whatsapp/new', {
      method: 'POST',
      body: { mobile, body },
    });
  }

  // Outlook Reply - POST /outlook/reply
  async sendEmailReply(replyMessageId, htmlBody, email) {
    return this.request('/outlook/reply', {
      method: 'POST',
      body: { replyMessageId, htmlBody, email },
    });
  }

  // Outlook New - POST /outlook/new
  async sendNewEmail(email, subject, htmlBody) {
    return this.request('/outlook/new', {
      method: 'POST',
      body: { email, subject, htmlBody },
    });
  }

  // Subscriptions - GET /subscriptions/:userId
  async getSubscriptions(userId, limit = 10) {
    return this.request(`/subscriptions/${userId}`, {
      method: 'GET',
    });
  }

  // Payments - GET /payments/:userId
  async getPayments(userId, limit = 10) {
    return this.request(`/payments/${userId}`, {
      method: 'GET',
    });
  }

  // Views - GET /views/:userId
  async getViews(userId, limit = 10) {
    return this.request(`/views/${userId}`, {
      method: 'GET',
    });
  }

  // Activities - GET /activities/:userId
  async getActivities(inboxId, limit = 10) {
    return this.request(`/activities/${inboxId}`, {
      method: 'GET',
    });
  }

  // Create Activity - POST /activity
  async createActivity(inboxId, body, dueDate) {
    return this.request('/activity', {
      method: 'POST',
      body: { inboxId, body, dueDate },
    });
  }

  // Query Types - GET /queryTypes (for dropdown options)
  async fetchQueryTypes() {
    return this.request('/queryTypes');
  }

  // Create Query Type - POST /queryType
  async createQueryType(name) {
    return this.request('/queryType', {
      method: 'POST',
      body: { name },
    });
  }

  // WhatsApp Templates - GET /whatsapp/templates
  async fetchWhatsappTemplates() {
    return this.request('/whatsapp/templates');
  }

  // Send WhatsApp Template - POST /whatsapp/template
  async sendWhatsappTemplateWithParams(mobile, template) {
    return this.request('/whatsapp/template', {
      method: 'POST',
      body: { mobile, template },
    });
  }
}

export const apiService = new ApiService();
