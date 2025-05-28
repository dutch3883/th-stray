import { createTestUser, getAuthToken, deleteAllUsers } from './auth';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';
import { AuthResponse } from './auth';
import { CatType } from '../src/domain/Report';

// Add type definition for create report response
interface CreateReportResponse {
  result: {
    id: string;
  }
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
describe('Create Report Function', () => {
  // Test user credentials
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let authToken: string;

  beforeAll(async () => {
    // Create a test user and get authentication token
    await createTestUser(testEmail, testPassword);
    const auth: AuthResponse = await getAuthToken(testEmail, testPassword);
    authToken = auth.idToken;
  });

  afterAll(async () => {
    await deleteAllUsers();
  });

  it('should successfully create a report when authenticated', async () => {
    // Prepare test data according to CreateReportDto
    const reportData = {
      numberOfCats: 1,
      type: CatType.stray,
      contactPhone: '0812345678',
      description: 'Test stray cat spotted',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      }
    };

    // Call the create report function through the emulator
    const response: Response = await fetch(
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

    const body = await response.json() 

    console.log(`body: ${JSON.stringify(body)}`)
    expect(response.status).toBe(200);
    
    const data = body as CreateReportResponse;
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('id');
    expect(typeof data.result.id).toBe('number');
  });

  it('should reject unauthorized requests', async () => {
    // Prepare test data according to CreateReportDto
    const reportData = {
      numberOfCats: 1,
      type: CatType.stray,
      contactPhone: '0812345678',
      description: 'Test stray cat spotted',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      }
    };

    // Call without auth token
    const response = await fetch(
      'http://localhost:5001/th-stray/us-central1/createReport', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: reportData
        }),
      }
    );

    expect(response.status).toBe(401);
    
    const errorData = await response.json() as ErrorResponse;
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('message');
    expect(errorData.error.message).toBe('User must be authenticated');
    expect(errorData.error).toHaveProperty('status', 'UNAUTHENTICATED');
  });
}); 