import { createTestUser, getAuthToken, setUserRole } from './auth';
import { describe, it, beforeAll, expect, jest } from '@jest/globals';
import { AuthResponse } from './auth';
import { CatType, ReportStatus } from '../src/domain/Report';

// Add type definition for list reports response
interface ListReportsResponse {
  result: Array<{
    id: number;
    status: ReportStatus;
    type: CatType;
    createdAt: { _seconds: number; _nanoseconds: number };
  }>;
}

// Add type definition for create report response
interface CreateReportResponse {
  result: {
    id: number;
    status: ReportStatus;
    type: CatType;
    createdAt: { _seconds: number; _nanoseconds: number };
  };
}

// Add type definition for error response
interface ErrorResponse {
  error: {
    message: string;
    status: string;
    code?: string;
    details?: unknown;
  }
}

jest.setTimeout(30000);

describe('List Reports Function', () => {
  // Test user credentials
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let authToken: string;
  let existingReports: ListReportsResponse['result'] = [];
  let testReportIds: number[] = [];

  // Helper function to make API calls
  const callListReports = async (data: any, useAuth: boolean = true): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (useAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/listReports',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ data }),
      }
    );
    return response;
  };

  // Helper function to count reports by filter
  const countReportsByFilter = (
    reports: ListReportsResponse['result'],
    filter: (report: ListReportsResponse['result'][0]) => boolean
  ) => {
    return reports.filter(filter).length;
  };

  // Helper function to count existing reports by filter
  const countExistingReportsByFilter = (
    filter: (report: ListReportsResponse['result'][0]) => boolean
  ) => {
    return countReportsByFilter(existingReports, filter);
  };

  // Helper function to count new test reports by filter
  const countNewReportsByFilter = (
    reports: ListReportsResponse['result'],
    filter: (report: ListReportsResponse['result'][0]) => boolean
  ) => {
    return countReportsByFilter(
      reports.filter(r => testReportIds.includes(r.id)),
      filter
    );
  };

  beforeAll(async () => {
    // Create a test user and get authentication token
    await createTestUser(testEmail, testPassword);
    const auth: AuthResponse = await getAuthToken(testEmail, testPassword);
    authToken = auth.idToken;
    await setUserRole(auth.localId, 'rescuer');

    // Get existing reports before adding test data
    const existingResponse = await callListReports({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (existingResponse.status === 200) {
      const data = await existingResponse.json() as ListReportsResponse;
      if (data && data.result) {
        existingReports = data.result;
      }
    }

    // Create test reports with different statuses and types
    const testReports = [
      {
        numberOfCats: 1,
        type: CatType.stray,
        contactPhone: '0812345678',
        description: 'Test stray cat 1',
        images: ['https://example.com/test-photo-1.jpg'],
        location: {
          lat: 13.7563,
          long: 100.5018,
          description: 'Near 7-11'
        }
      },
      {
        numberOfCats: 2,
        type: CatType.injured,
        contactPhone: '0812345679',
        description: 'Test injured cat 1',
        images: ['https://example.com/test-photo-2.jpg'],
        location: {
          lat: 13.7564,
          long: 100.5019,
          description: 'Near BTS'
        }
      },
      {
        numberOfCats: 1,
        type: CatType.stray,
        contactPhone: '0812345680',
        description: 'Test stray cat 2',
        images: ['https://example.com/test-photo-3.jpg'],
        location: {
          lat: 13.7565,
          long: 100.5020,
          description: 'Near MRT'
        }
      }
    ];

    // Create all test reports
    for (const reportData of testReports) {
      const response = await fetch(
        'http://localhost:5001/th-stray/asia-northeast1/createReport',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            data: reportData
          }),
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`Failed to create test report: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json() as CreateReportResponse;
      if (!result || !result.result || !result.result.id) {
        throw new Error('Invalid create report response: missing result or id');
      }
      
      testReportIds.push(result.result.id);
    }

    // Update status of some reports to test filtering
    const listResponse = await callListReports({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (listResponse.status !== 200) {
      throw new Error(`Failed to list reports: ${listResponse.status} ${listResponse.statusText}`);
    }

    const responseData = await listResponse.json() as ListReportsResponse;
    
    if (!responseData || !responseData.result) {
      throw new Error('Invalid response structure: missing result property');
    }

    const reports = responseData.result;
    const newReports = reports.filter(r => testReportIds.includes(r.id));
    
    // Update first report to completed
    if (newReports.length > 0) {
      await fetch(
        'http://localhost:5001/th-stray/asia-northeast1/completeReport',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            data: {
              reportId: newReports[0].id,
              remark: 'Test completion'
            }
          }),
        }
      );
    }

    // Update second report to on hold
    if (newReports.length > 1) {
      await fetch(
        'http://localhost:5001/th-stray/asia-northeast1/putReportOnHold',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            data: {
              reportId: newReports[1].id,
              remark: 'Test hold'
            }
          }),
        }
      );
    }
  });

  it('should return all reports when no filters are applied', async () => {
    const response = await callListReports({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    expect(response.status).toBe(200);
    const data = await response.json() as ListReportsResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    expect(data.result.length).toBeGreaterThanOrEqual(existingReports.length + 3); // 3 new test reports
  });

  it('should filter by status and sort manually', async () => {
    const response = await callListReports({
      status: ReportStatus.pending,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    expect(response.status).toBe(200);
    const data = await response.json() as ListReportsResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    
    if (!data.result) {
      throw new Error('Response missing result property');
    }
    
    const existingPendingCount = countExistingReportsByFilter(r => r.status === ReportStatus.pending);
    const newPendingCount = countNewReportsByFilter(data.result, r => r.status === ReportStatus.pending);
    
    expect(newPendingCount).toBe(1); // Only the third test report should be pending
    expect(data.result.length).toBeGreaterThanOrEqual(existingPendingCount + newPendingCount);
  });

  it('should filter by type and sort manually', async () => {
    const response = await callListReports({
      type: CatType.stray,
      sortBy: 'createdAt',
      sortOrder: 'asc'
    });

    expect(response.status).toBe(200);
    const data = await response.json() as ListReportsResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    
    if (!data.result) {
      throw new Error('Response missing result property');
    }
    
    const existingStrayCount = countExistingReportsByFilter(r => r.type === CatType.stray);
    const newStrayCount = countNewReportsByFilter(data.result, r => r.type === CatType.stray);
    
    expect(newStrayCount).toBe(2); // Two of our test reports are stray cats
    expect(data.result.length).toBeGreaterThanOrEqual(existingStrayCount + newStrayCount);
  });

  it('should filter by both status and type and sort manually', async () => {
    const response = await callListReports({
      status: ReportStatus.pending,
      type: CatType.stray,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    expect(response.status).toBe(200);
    const data = await response.json() as ListReportsResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    
    if (!data.result) {
      throw new Error('Response missing result property');
    }
    
    const existingPendingStrayCount = countExistingReportsByFilter(
      r => r.status === ReportStatus.pending && r.type === CatType.stray
    );
    const newPendingStrayCount = countNewReportsByFilter(
      data.result,
      r => r.status === ReportStatus.pending && r.type === CatType.stray
    );
    
    expect(newPendingStrayCount).toBe(1); // Only the third test report should be pending and stray
    expect(data.result.length).toBeGreaterThanOrEqual(existingPendingStrayCount + newPendingStrayCount);
  });

  it('should handle empty results', async () => {
    const response = await callListReports({
      status: ReportStatus.cancelled, // Assuming no cancelled reports exist
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    expect(response.status).toBe(200);
    const data = await response.json() as ListReportsResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    expect(data.result.length).toBe(0); // No cancelled reports should exist
  });

  it('should reject unauthorized requests', async () => {
    const response = await callListReports({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }, false);

    expect(response.status).toBe(401);
    const errorData = await response.json() as ErrorResponse;
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('message');
    expect(errorData.error.message).toBe('User must be authenticated');
    expect(errorData.error).toHaveProperty('status', 'UNAUTHENTICATED');
  });

  it('should reject reporter role access', async () => {
    // Create a new test user with reporter role
    const reporterEmail = `test-reporter-${Date.now()}@example.com`;
    const reporterPassword = 'Test123!';
    
    await createTestUser(reporterEmail, reporterPassword);
    const reporterAuth = await getAuthToken(reporterEmail, reporterPassword);
    await setUserRole(reporterAuth.localId, 'reporter');

    // Try to list reports with reporter role
    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/listReports',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${reporterAuth.idToken}`
        },
        body: JSON.stringify({
          data: {
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
      }
    );

    expect(response.status).toBe(403);
    const errorData = await response.json() as ErrorResponse;
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('message');
    expect(errorData.error.message).toBe('Operation listReports requires roles: admin, rescuer');
    expect(errorData.error).toHaveProperty('status', 'PERMISSION_DENIED');
  });
}); 