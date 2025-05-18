// src/services/apiService.ts
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { functions } from '../firebase';
import { ReportDTO, ReportStatus, CatType, Location } from '../types/report';

const auth = getAuth(app);

// optional custom endpoint, as before
const host = import.meta.env.VITE_CLOUD_FUNCTION_ENDPOINTS;
const fns = host
  ? getFunctions(app, host.startsWith('http') ? host : `https://${host}`)
  : getFunctions(app);

// Type definitions
export interface CreateReportParams {
  numberOfCats: number;
  type: CatType;
  contactPhone: string;
  description?: string;
  images: string[];
  location: Location;
}

export interface UpdateReportParams {
  reportId: string;
  data: CreateReportParams;
}

export interface StatusChangeParams {
  reportId: string;
  remark: string;
}

export interface ListReportsParams {
  status?: ReportStatus;
  type?: CatType;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Firebase function references
const createReportFn = httpsCallable<CreateReportParams, { id: string }>(functions, 'createReport');
const listMyReportsFn = httpsCallable<{}, ReportDTO[]>(functions, 'listMyReports');
const listReportsFn = httpsCallable<ListReportsParams, ReportDTO[]>(functions, 'listReports');
const updateReportFn = httpsCallable<UpdateReportParams, void>(functions, 'updateReport');
const cancelReportFn = httpsCallable<StatusChangeParams, void>(functions, 'cancelReport');
const putReportOnHoldFn = httpsCallable<StatusChangeParams, void>(functions, 'putReportOnHold');
const resumeReportFn = httpsCallable<StatusChangeParams, void>(functions, 'resumeReport');
const completeReportFn = httpsCallable<StatusChangeParams, void>(functions, 'completeReport');

// Helper functions for type-safe API calls
export const api = {
  createReport: async (params: CreateReportParams): Promise<string> => {
    const result = await createReportFn(params);
    return result.data.id;
  },

  listMyReports: async (): Promise<ReportDTO[]> => {
    const result = await listMyReportsFn();
    return result.data;
  },

  listReports: async (params: ListReportsParams): Promise<ReportDTO[]> => {
    const result = await listReportsFn(params);
    return result.data;
  },

  updateReport: async (params: UpdateReportParams): Promise<void> => {
    await updateReportFn(params);
  },

  cancelReport: async (params: StatusChangeParams): Promise<void> => {
    await cancelReportFn(params);
  },

  putReportOnHold: async (params: StatusChangeParams): Promise<void> => {
    await putReportOnHoldFn(params);
  },

  resumeReport: async (params: StatusChangeParams): Promise<void> => {
    await resumeReportFn(params);
  },

  completeReport: async (params: StatusChangeParams): Promise<void> => {
    await completeReportFn(params);
  },
};