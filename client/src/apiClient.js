/**
 * Centralized API client.
 * Automatically injects the Firebase UID into every request
 * via the X-User-ID header for per-user rate limiting.
 */
import { API_BASE_URL, NOTIFICATION_SERVER_URL } from './config';
import { auth } from './firebase';

/** Build headers, injecting the Firebase UID when a user is signed in. */
function getHeaders(extra = {}) {
  const uid = auth.currentUser?.uid;
  return {
    'Content-Type': 'application/json',
    ...(uid ? { 'X-User-ID': uid } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail || {};
    const msg =
      detail?.message ||
      `Rate limit exceeded. Please wait before trying again.`;
    const err = new Error(msg);
    err.isRateLimit = true;
    err.resetIn = detail?.reset_in ?? null;
    err.remaining = detail?.remaining ?? 0;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  analyze(ticker, date) {
    return fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ticker, date }),
    }).then(handleResponse);
  },

  getStatus(runId) {
    return fetch(`${API_BASE_URL}/api/status/${runId}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getHistory() {
    return fetch(`${API_BASE_URL}/api/history`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  deleteHistory(runId) {
    return fetch(`${API_BASE_URL}/api/history/${runId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getMetrics(ticker) {
    return fetch(`${API_BASE_URL}/api/metrics/${ticker}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getChartData(ticker, period = '6mo') {
    return fetch(`${API_BASE_URL}/api/chart-data/${ticker}?period=${period}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getQuota() {
    return fetch(`${API_BASE_URL}/api/quota`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getRateLimitStatus() {
    return fetch(`${API_BASE_URL}/api/rate-limit-status`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  mailReport(runId, email = null) {
    return fetch(`${API_BASE_URL}/api/mail-report/${runId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    }).then(handleResponse);
  },

  /** Register FCM token and preferences */
  registerFCMToken(uid, token, email, emailEnabled = true) {
    return fetch(`${NOTIFICATION_SERVER_URL}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, email, emailEnabled }),
    }).then(handleResponse);
  },

  /** Get current notification settings */
  getNotificationSettings(uid) {
    return fetch(`${NOTIFICATION_SERVER_URL}/api/notifications/settings/${uid}`, {
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },
};
