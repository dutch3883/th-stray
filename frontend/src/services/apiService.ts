// src/services/apiService.ts
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import type { Report } from '../models';

const auth = getAuth(app);

// optional custom endpoint, as before
const host = import.meta.env.VITE_CLOUD_FUNCTION_ENDPOINTS;
const fns = host
  ? getFunctions(app, host.startsWith('http') ? host : `https://${host}`)
  : getFunctions(app);

/** Helper to invoke a callable and get the raw data */
async function call<T = any, P = any>(fnName: string, payload: P): Promise<T> {
  const fn = httpsCallable<P, T>(fns, fnName);
  const res = await fn(payload);
  return res.data;
}

// ── USER calls ──────────────────────────────────────────────────────────────

/** Create a new report, returns { id } */
export function createReport(payload: {
  numberOfCats: number;
  type: 'stray' | 'injured' | 'sick' | 'kitten';
  contactPhone: string;
  images: string[];
  location: Location;
}): Promise<{ id: string }> {
  return call('createReport', payload);
}

/** Get your own reports (typed as Report[]) */
export function listMyReports(): Promise<Report[]> {
  return call<Report[]>('listMyReports', {});
}

// ── ADMIN calls ─────────────────────────────────────────────────────────────

/** List all reports (typed as Report[]) */
export function adminListReports(): Promise<Report[]> {
  return call<Report[]>('adminListReports', {});
}

/** Change a report’s status → { ok: true } */
export function adminChangeStatus(
  params: { id: string; status: 'complete' | 'cancelled'; note?: string; photoUrl?: string }
): Promise<{ ok: boolean }> {
  return call('changeStatus', params);
}