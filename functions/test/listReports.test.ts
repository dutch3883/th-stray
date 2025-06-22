import { createTestUser, getAuthToken, setUserRole } from './auth';
import { describe, it, beforeAll, expect, jest } from '@jest/globals';
import { AuthResponse } from './auth';
import { CatType, ReportStatus } from '../src/domain/Report';
import { clearAllEmulatorData } from './firestore';
import * as fc from 'fast-check';

// Add type definition for list reports response
interface ListReportsResponse {
  result: Array<{
    id: number;
    status: ReportStatus;
    type: CatType;
    createdAt: string; // ISO date string format
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

// Property-based testing utilities
interface TestReportData {
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
}

// Fast-check arbitraries for generating test data
const catTypeArb = fc.constantFrom(...Object.values(CatType));
const sortOrderArb = fc.constantFrom('asc', 'desc');
const sortByArb = fc.constantFrom('createdAt', 'id', 'status', 'type');

// Property-based test properties
const testProperties = {
  // Property: Sorting should always maintain order regardless of data
  sortingMaintainsOrder: (reports: ListReportsResponse['result'], sortOrder: 'asc' | 'desc') => {
    if (reports.length <= 1) return true;
    
    const actualIds = reports.map(r => r.id);
    const expectedIds = [...reports]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      })
      .map(r => r.id);
    
    return JSON.stringify(actualIds) === JSON.stringify(expectedIds);
  },
  
  // Property: Filtering should only return matching items
  filteringReturnsOnlyMatching: (reports: ListReportsResponse['result'], filter: (r: any) => boolean) => {
    return reports.every(filter);
  },
  
  // Property: Combined filtering should be intersection of individual filters
  combinedFilteringIsIntersection: (
    reports: ListReportsResponse['result'], 
    statusFilter: ReportStatus | null, 
    typeFilter: CatType | null
  ) => {
    const expectedFiltered = reports.filter(r => {
      const statusMatch = !statusFilter || r.status === statusFilter;
      const typeMatch = !typeFilter || r.type === typeFilter;
      return statusMatch && typeMatch;
    });
    
    return expectedFiltered.length === reports.length;
  },
  
  // Property: All reports should have valid timestamps
  allReportsHaveValidTimestamps: (reports: ListReportsResponse['result']) => {
    const invalidReports = reports.filter(r => {
      if (typeof r.createdAt !== 'string') return true;
      const timestamp = new Date(r.createdAt);
      return isNaN(timestamp.getTime());
    });
    
    if (invalidReports.length > 0) {
      console.log('❌ Reports with invalid timestamps:');
      invalidReports.forEach((report, index) => {
        console.log(`  Report ${index + 1} (ID: ${report.id}):`);
        console.log(`    Expected: createdAt to be a valid ISO date string`);
        console.log(`    Actual: createdAt = ${report.createdAt} (type: ${typeof report.createdAt})`);
        console.log(`    Full report:`, JSON.stringify(report, null, 2));
      });
      return false;
    }
    
    return true;
  },
  
  // Property: All reports should have unique IDs
  allReportsHaveUniqueIds: (reports: ListReportsResponse['result']) => {
    const ids = reports.map(r => r.id);
    return new Set(ids).size === ids.length;
  }
};

jest.setTimeout(30000);

describe('List Reports Function - Property Based Tests', () => {
  // Test user credentials
  const testEmail = `test-list-user-${Date.now()}@example.com`;
  const testPassword = 'Test123!';
  let authToken: string;

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

  // Helper function to create test data for each iteration
  const createTestData = async (): Promise<{ reports: ListReportsResponse['result'], reportIds: number[] }> => {
    // Clear only reports collection (keep user data)
    try {
      await fetch(
        'http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/reports',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      // Ignore errors if collection doesn't exist
    }
    
    // Create multiple random test reports
    const numTestReports = 15;
    const testReports: TestReportData[] = [];
    const reportIds: number[] = [];
    
    for (let i = 0; i < numTestReports; i++) {
      testReports.push(generateRandomTestReport());
    }

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
      
      reportIds.push(result.result.id);
    }

    // Update status of some reports randomly to test filtering
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
    const newReports = reports.filter(r => reportIds.includes(r.id));
    
    // Randomly update some reports to different statuses
    const statuses = [ReportStatus.completed, ReportStatus.onHold, ReportStatus.cancelled, null];
    const updatePromises = newReports.slice(0, Math.floor(newReports.length / 2)).map(async (report, index) => {
      const randomStatus = statuses[index % statuses.length];
      
      if (randomStatus !== null) { // Only update if not null
        const endpoints: Partial<Record<ReportStatus, string>> = {
          [ReportStatus.completed]: 'completeReport',
          [ReportStatus.onHold]: 'putReportOnHold',
          [ReportStatus.cancelled]: 'cancelReport'
        };
        
        const endpoint = endpoints[randomStatus as ReportStatus];
        if (endpoint) {
          await fetch(
            `http://localhost:5001/th-stray/asia-northeast1/${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                data: {
                  reportId: report.id,
                  remark: `Test ${randomStatus}`
                }
              }),
            }
          );
        }
      }
      // If randomStatus is null, do nothing
    });
    
    await Promise.all(updatePromises);

    // Get final list of reports
    const finalResponse = await callListReports({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (finalResponse.status !== 200) {
      throw new Error(`Failed to get final reports: ${finalResponse.status} ${finalResponse.statusText}`);
    }

    const finalData = await finalResponse.json() as ListReportsResponse;
    return { reports: finalData.result, reportIds };
  };

  // Legacy function for backward compatibility (will be removed)
  const generateRandomTestReport = (): TestReportData => {
    const types = Object.values(CatType);
    const locations = [
      { lat: 13.7563, long: 100.5018, desc: 'Near 7-11' },
      { lat: 13.7564, long: 100.5019, desc: 'Near BTS' },
      { lat: 13.7565, long: 100.5020, desc: 'Near MRT' },
      { lat: 13.7566, long: 100.5021, desc: 'Near Central' },
      { lat: 13.7567, long: 100.5022, desc: 'Near Terminal 21' },
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomCats = Math.floor(Math.random() * 5) + 1; // 1-5 cats
    const randomPhone = `08${Math.floor(Math.random() * 90000000) + 10000000}`; // 08xxxxxxxx
    const randomDesc = `Test ${randomType} cat ${Math.random().toString(36).substring(7)}`;
    const randomImages = [`https://example.com/test-photo-${Math.random().toString(36).substring(7)}.jpg`];
    
    return {
      numberOfCats: randomCats,
      type: randomType,
      contactPhone: randomPhone,
      description: randomDesc,
      images: randomImages,
      location: {
        lat: randomLocation.lat + (Math.random() - 0.5) * 0.01, // Add some randomness
        long: randomLocation.long + (Math.random() - 0.5) * 0.01,
        description: randomLocation.desc
      }
    };
  };

  beforeAll(async () => {
    // Create a test user and get authentication token
    await createTestUser(testEmail, testPassword);
    const auth: AuthResponse = await getAuthToken(testEmail, testPassword);
    authToken = auth.idToken;
    await setUserRole(auth.localId, 'rescuer');
  });

  // Fast-check property-based tests
  describe('Property: Sorting maintains order', () => {
    it('should maintain descending order', async () => {
      await fc.assert(
        fc.asyncProperty(sortOrderArb, async (sortOrder) => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          await createTestData();
          
          const response = await callListReports({
            sortBy: 'createdAt',
            sortOrder
          });
          
          expect(response.status).toBe(200);
          const data = await response.json() as ListReportsResponse;
          expect(data).toHaveProperty('result');
          expect(Array.isArray(data.result)).toBe(true);
          
          if (!data.result) {
            throw new Error('Response missing result property');
          }
          
          const propertyHolds = testProperties.sortingMaintainsOrder(data.result, sortOrder);
          
          return propertyHolds;
        }),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000, // 60 seconds
          markInterruptAsFailure: true
        }
      );
    });
  });

  describe('Property: Filtering returns only matching items', () => {
    it('should filter by status correctly', async () => {
      await fc.assert(
        fc.asyncProperty(catTypeArb, async (type) => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          await createTestData();
          
          const response = await callListReports({
            type,
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
          
          const propertyHolds = testProperties.filteringReturnsOnlyMatching(
            data.result, 
            (r) => r.type === type
          );
          
          return propertyHolds;
        }),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000,
          markInterruptAsFailure: true
        }
      );
    });

    it('should filter by type correctly', async () => {
      await fc.assert(
        fc.asyncProperty(catTypeArb, async (type) => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          await createTestData();
          
          const response = await callListReports({
            type,
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
          
          const propertyHolds = testProperties.filteringReturnsOnlyMatching(
            data.result, 
            (r) => r.type === type
          );
          
          return propertyHolds;
        }),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000,
          markInterruptAsFailure: true
        }
      );
    });
  });

  describe('Property: Combined filtering is intersection', () => {
    it('should handle combined filters correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(ReportStatus.pending, ReportStatus.completed, ReportStatus.onHold),
          catTypeArb,
          sortByArb,
          sortOrderArb,
          async (status, type, sortBy, sortOrder) => {
            // Clear all emulator data before each test
            await clearAllEmulatorData();
            
            await createTestData();
            
            const response = await callListReports({
              status,
              type,
              sortBy,
              sortOrder
            });
            
            expect(response.status).toBe(200);
            const data = await response.json() as ListReportsResponse;
            expect(data).toHaveProperty('result');
            expect(Array.isArray(data.result)).toBe(true);
            
            if (!data.result) {
              throw new Error('Response missing result property');
            }
            
            // Check that filtering is correct
            const propertyHolds = testProperties.combinedFilteringIsIntersection(
              data.result, 
              status, 
              type
            );
            
            // Check that sorting is correct
            if (data.result.length > 1) {
              const actualIds = data.result.map(r => r.id);
              const expectedIds = [...data.result]
                .sort((a, b) => {
                  let aValue: any, bValue: any;
                  
                  switch (sortBy) {
                    case 'createdAt':
                      aValue = new Date(a.createdAt).getTime();
                      bValue = new Date(b.createdAt).getTime();
                      break;
                    case 'id':
                      aValue = a.id;
                      bValue = b.id;
                      break;
                    case 'status':
                      aValue = a.status;
                      bValue = b.status;
                      break;
                    case 'type':
                      aValue = a.type;
                      bValue = b.type;
                      break;
                    default:
                      aValue = new Date(a.createdAt).getTime();
                      bValue = new Date(b.createdAt).getTime();
                  }
                  
                  if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                  if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                  return 0;
                })
                .map(r => r.id);
              console.log("ids compare",actualIds, expectedIds)
              if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
                throw new Error(`Combined filter sorting failed for status=${status}, type=${type}, sortBy=${sortBy}, sortOrder=${sortOrder}. Expected: ${JSON.stringify(expectedIds)}, Actual: ${JSON.stringify(actualIds)}`);
              }
            }
            
            return propertyHolds;
          }
        ),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000,
          markInterruptAsFailure: true
        }
      );
    });
  });

  describe('Property: Data integrity', () => {
    it('should have valid timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          await createTestData();
          
          const response = await callListReports({
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
          
          // Check each report individually for better error reporting
          data.result.forEach((report, index) => {
            const reportLabel = `Report ${index} (ID: ${report.id})`;
            
            if (typeof report.createdAt !== 'string') {
              throw new Error(`${reportLabel}: Expected createdAt to be a string, but got ${typeof report.createdAt}`);
            }
            
            // Check if it's a valid ISO date string
            const timestamp = new Date(report.createdAt);
            if (isNaN(timestamp.getTime())) {
              throw new Error(`${reportLabel}: Expected createdAt to be a valid ISO date string, but got "${report.createdAt}"`);
            }
            
            // Check if it's a recent date (not too old or future)
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            
            if (timestamp < oneYearAgo || timestamp > oneYearFromNow) {
              throw new Error(`${reportLabel}: Expected createdAt to be within reasonable range, but got "${report.createdAt}"`);
            }
          });
          
          return true;
        }),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000, // 60 seconds
          markInterruptAsFailure: true
        }
      );
    });

    it('should have unique IDs', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          await createTestData();
          
          const response = await callListReports({
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
          
          const propertyHolds = testProperties.allReportsHaveUniqueIds(data.result);
          
          return propertyHolds;
        }),
        { 
          numRuns: 10,
          interruptAfterTimeLimit: 60000,
          markInterruptAsFailure: true
        }
      );
    });
  });

  // Property: List all reports without filters
  describe('Property: List all reports without filters', () => {
    it('should return all reports when no filters are applied', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Clear all emulator data before each test
          await clearAllEmulatorData();
          
          // Create test data
          await createTestData();
          
          const response = await callListReports({
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });

          expect(response.status).toBe(200);
          const data = await response.json() as ListReportsResponse;
          expect(data).toHaveProperty('result');
          expect(Array.isArray(data.result)).toBe(true);
          expect(data.result.length).toBeGreaterThanOrEqual(15); // 15 new test reports

          // Verify sorting by createdAt in descending order
          if (data.result && data.result.length > 1) {
            const actualIds = data.result.map(r => r.id);
            const expectedIds = [...data.result]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(r => r.id);
            expect(actualIds).toEqual(expectedIds);
          }
          
          return true;
        }),
        { 
          numRuns: 5,
          interruptAfterTimeLimit: 60000,
          markInterruptAsFailure: true
        }
      );
    });
  });

  // Original specific tests (kept for backward compatibility)
  describe('Specific Test Cases', () => {
    it('should handle empty results', async () => {
      // Clear all emulator data first
      await clearAllEmulatorData();
      
      // Now filter for a status that shouldn't exist in our test data
      const response = await callListReports({
        status: ReportStatus.cancelled, // Assuming no cancelled reports exist in our test data
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
}); 