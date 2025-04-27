// src/services/apiService.js  ← only the admin section changed
import { getAuth } from 'firebase/auth';
import { app }      from '../firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const auth      = getAuth(app);

/* ---------- helper ---------- */
async function idToken() {
  return auth.currentUser?.getIdToken?.();
}
async function apiFetch(method, path, body, qs = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(qs).forEach(([k, v]) => v != null && url.searchParams.append(k, v));

  const res = await fetch(url, {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${await idToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

/* … USER endpoints stay the same … */

/* ---------- ADMIN endpoints ---------- */

/**
 * List / filter all reports (unchanged).
 */
export const adminListReports = (opts = {}) =>
  apiFetch('GET', '/admin/reports', null, opts);

/**
 * Complete a report.
 * @param {string} id        Report ID
 * @param {Object} options   { note?, photoUrl? }
 * @returns {Promise<void>}
 */
export const adminCompleteReport = (id, { note, photoUrl } = {}) =>
  apiFetch('PATCH', `/admin/reports/${id}/status`, {
    status: 'complete',
    note,
    photoUrl,
  });

/**
 * Cancel a report.
 * @param {string} id        Report ID
 * @param {string} note      Reason for cancellation
 */
export const adminCancelReport = (id, note) =>
  apiFetch('PATCH', `/admin/reports/${id}/status`, {
    status: 'cancelled',
    note,
  });

/**
 * (optional helper) generic status changer if you still want it.
 */
export const adminChangeStatus = (id, body) =>
  apiFetch('PATCH', `/admin/reports/${id}/status`, body);

/**
 * Upload rescue-proof image → returns { photoUrl }
 */
export async function adminUploadCompletionPhoto(id, file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/admin/reports/${id}/completion-photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await idToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();            // { photoUrl }
}

/* ---------- Utility ---------- */
export const healthCheck = () => apiFetch('GET', '/healthz');
