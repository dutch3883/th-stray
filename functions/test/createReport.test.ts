import { createTestUser, getAuthToken } from './auth';
import { describe, it, beforeAll, afterEach, expect, jest } from '@jest/globals';
import { AuthResponse } from './auth';
import { CatType, ResidentType } from '../src/domain/Report';
import { clearAllFirestoreData } from './firestore';

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
  const testEmail = `test-create-user-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let authToken: string;

  beforeAll(async () => {
    // Clear any existing test data
    await clearAllFirestoreData();
    
    // Create a test user and get authentication token
    await createTestUser(testEmail, testPassword);
    const auth: AuthResponse = await getAuthToken(testEmail, testPassword);
    authToken = auth.idToken;
  });

  afterEach(async () => {
    // Clear Firestore data after each test to ensure isolation
    await clearAllFirestoreData();
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
      },
      isEmergency: false,
      residentType: ResidentType.resident,
      socialMedia: 'test@instagram',
      problem: 'Stray cat needs help',
      additionalLocationDetails: 'Near the corner store',
      canSpeakEnglish: true
    };

    // Call the create report function through the emulator
    const response: Response = await fetch(
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
      },
      isEmergency: false,
      residentType: ResidentType.resident,
      socialMedia: 'test@instagram',
      problem: 'Stray cat needs help',
      additionalLocationDetails: 'Near the corner store',
      canSpeakEnglish: true
    };

    // Call without auth token
    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/createReport', 
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

  it('should validate mandatory fields and reject incomplete data', async () => {
    // Test data missing required fields
    const incompleteReportData = {
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
      // Missing: isEmergency, residentType, problem, canSpeakEnglish
    };

    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/createReport', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          data: incompleteReportData
        }),
      }
    );

    expect(response.status).toBe(400);
    
    const errorData = await response.json() as ErrorResponse;
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('status', 'INVALID_ARGUMENT');
    expect(errorData.error.message).toContain('Invalid data');
    
    // Check that specific validation errors are mentioned
    expect(errorData.error.message).toContain('isEmergency');
    expect(errorData.error.message).toContain('residentType');
    expect(errorData.error.message).toContain('problem');
    expect(errorData.error.message).toContain('canSpeakEnglish');
  });

  it('should validate contact information requirement', async () => {
    // Test data without any contact information
    const reportDataWithoutContact = {
      numberOfCats: 1,
      type: CatType.stray,
      // No contactPhone, lineId, or whatsApp
      description: 'Test stray cat spotted',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      },
      isEmergency: false,
      residentType: ResidentType.resident,
      problem: 'Stray cat needs help',
      canSpeakEnglish: true
    };

    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/createReport', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          data: reportDataWithoutContact
        }),
      }
    );

    expect(response.status).toBe(400);
    
    const errorData = await response.json() as ErrorResponse;
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toHaveProperty('status', 'INVALID_ARGUMENT');
    expect(errorData.error.message).toContain('At least one contact method');
  });

  it('should accept reports with lineId instead of contactPhone', async () => {
    const reportDataWithLineId = {
      numberOfCats: 1,
      type: CatType.stray,
      lineId: 'testuser123',
      description: 'Test stray cat spotted',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      },
      isEmergency: false,
      residentType: ResidentType.resident,
      problem: 'Stray cat needs help',
      canSpeakEnglish: true
    };

    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/createReport', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          data: reportDataWithLineId
        }),
      }
    );

    expect(response.status).toBe(200);
    
    const result = await response.json() as CreateReportResponse;
    expect(result).toHaveProperty('result');
    expect(result.result).toHaveProperty('id');
    expect(typeof result.result.id).toBe('number');
  });

  it('should accept reports with whatsApp instead of contactPhone', async () => {
    const reportDataWithWhatsApp = {
      numberOfCats: 1,
      type: CatType.stray,
      whatsApp: '66812345678',
      description: 'Test stray cat spotted',
      images: ['https://example.com/test-photo.jpg'],
      location: {
        lat: 13.7563,
        long: 100.5018,
        description: 'Near 7-11'
      },
      isEmergency: false,
      residentType: ResidentType.resident,
      problem: 'Stray cat needs help',
      canSpeakEnglish: true
    };

    const response = await fetch(
      'http://localhost:5001/th-stray/asia-northeast1/createReport', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          data: reportDataWithWhatsApp
        }),
      }
    );

    expect(response.status).toBe(200);
    
    const result = await response.json() as CreateReportResponse;
    expect(result).toHaveProperty('result');
    expect(result.result).toHaveProperty('id');
    expect(typeof result.result.id).toBe('number');
  });
}); 