// Global test setup
import dotenv from 'dotenv';
import { beforeAll, afterAll, jest } from '@jest/globals';
import { clearAllFirestoreData, isFirestoreEmulatorRunning } from './firestore';
import { deleteAllUsers } from './auth';

// Load environment variables from .env file
dotenv.config({ path: './test/.env' });

// Increase test timeout for API calls
jest.setTimeout(30000);

// Global test utilities
export const testUtils = {
  /**
   * Clear all test data from emulators
   */
  async clearAllTestData(): Promise<void> {
    try {
      // Check if Firestore emulator is running
      const isFirestoreRunning = await isFirestoreEmulatorRunning();
      if (isFirestoreRunning) {
        await clearAllFirestoreData();
        console.log('✅ Cleared all Firestore data');
      }
      
      // Clear Auth emulator data
      await deleteAllUsers();
      console.log('✅ Cleared all Auth data');
    } catch (error) {
      console.warn('⚠️ Failed to clear some test data:', error);
    }
  },

  /**
   * Setup clean state before tests
   */
  async setupCleanState(): Promise<void> {
    await this.clearAllTestData();
  }
};

// Global beforeAll hook to ensure clean state
beforeAll(async () => {
  await testUtils.setupCleanState();
});

// Global afterAll hook to cleanup after all tests
afterAll(async () => {
  await testUtils.clearAllTestData();
}); 