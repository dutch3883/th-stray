import { createTestUser, getAuthToken, deleteAllUsers } from './auth';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';
import { AuthResponse } from './auth';
import { CatType} from '../src/domain/Report';

// Define interface for the response data structure
interface ReportListResponse {
  result: Array<{
    id: string;
    numberOfCats: number;
    type: CatType;
    contactPhone: string;
    description: string;
    images: string[];
    location: {
      lat: number;
      long: number;
      description: string;
    };
    status: string;
    createdAt: string;
  }>;
}
jest.setTimeout(30000);
describe('List Reports Function', () => {
  // Test user credentials
  const testEmail = `test-user-list-reports-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let authToken: string;

  beforeAll(async () => {
    // Create a test user and get authentication token
    await createTestUser(testEmail, testPassword);
    const auth: AuthResponse = await getAuthToken(testEmail, testPassword);
    authToken = auth.idToken;

    // Create a test report to ensure we have something to list
    const reportData = {
      numberOfCats: 1,
      type: CatType.stray,
      contactPhone: '0812345678',
      description: 'Test report for listing',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      }
    };

    await fetch(
      'http://localhost:5001/th-stray/us-central1/createReport', 
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
  });

  afterAll(async () => {
    await deleteAllUsers();
  });

  it('should successfully list reports when authenticated', async () => {
    // Call the list reports function through the emulator
    const response = await fetch(
      'http://localhost:5001/th-stray/us-central1/listMyReports', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          data: {}
        }),
      }
    );

    expect(response.status).toBe(200);
    
    const data = await response.json() as ReportListResponse;
    expect(data).toHaveProperty('result');
    expect(Array.isArray(data.result)).toBe(true);
    // There should be at least one report (the one we created in beforeAll)
    expect(data.result.length).toBeGreaterThan(0);
  });

  it('should reject unauthorized requests', async () => {
    // Call without auth token
    const response = await fetch(
      'http://localhost:5001/th-stray/us-central1/listMyReports', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {}
        }),
      }
    );

    expect(response.status).toBe(401);
  });
}); 