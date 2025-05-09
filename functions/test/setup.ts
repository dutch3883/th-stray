// Global test setup
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: './test/.env' });

// Increase test timeout for API calls
jest.setTimeout(30000); 