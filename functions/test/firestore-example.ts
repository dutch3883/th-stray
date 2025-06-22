/**
 * Example usage of Firestore utilities for testing
 */

import { 
  clearAllFirestoreData, 
  clearCollection, 
  clearDocument, 
  getAllDocuments,
  isFirestoreEmulatorRunning 
} from './firestore';

clearAllFirestoreData();