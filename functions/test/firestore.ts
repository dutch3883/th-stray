/**
 * Shared Firestore utilities for tests
 */

/**
 * Clear all data from Firestore emulator (keeps collections, only deletes documents)
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllFirestoreData(): Promise<void> {
  // Delete all documents at once
  const response = await fetch(
    'http://localhost:8080/emulator/v1/projects/th-stray/databases/(default)/documents',
    {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to clear Firestore data: ${response.status} ${response.statusText}`);
  }

  // Recreate the reports collection by creating and immediately deleting a dummy document
  try {
    // const createResponse = await fetch(
    //   'http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/reports',
    //   {
    //     method: 'POST',
    //     headers: { 
    //       'Content-Type': 'application/json',
    //       'Authorization': 'Bearer owner'
    //     },
    //     body: JSON.stringify({
    //       fields: {
    //         dummy: { stringValue: 'temp' }
    //       }
    //     })
    //   }
    // );

    // if (createResponse.status === 200) {
    // //   const docData = await createResponse.json() as { name: string };
    // //   const docId = docData.name.split('/').pop();
      
    // //   // Immediately delete the dummy document
    // //   await fetch(
    // //     `http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/reports/${docId}`,
    // //     {
    // //       method: 'DELETE',
    // //       headers: { 
    // //         'Content-Type': 'application/json',
    // //         'Authorization': 'Bearer owner'
    // //       },
    // //     }
    // //   );

    //     console.log(`✅ recreated reports collection ${createResponse.status}`);
    // }
    // else {
    //     console.warn(`⚠️ Failed to recreate reports collection: ${createResponse.status}`);
    // }

  } catch (error) {
    console.warn('⚠️ Failed to recreate reports collection:', error);
  }
}

/**
 * Clear all emulator data (Firestore + Storage)
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllEmulatorData(): Promise<void> {
  try {
    // Clear Firestore data
    await clearAllFirestoreData();
  } catch (error) {
    console.warn('⚠️ Failed to clear Firestore data:', error);
  }
}

/**
 * Clear specific collection from Firestore emulator
 * @param collectionName Name of the collection to clear
 * @returns Promise that resolves when collection is cleared
 */
export async function clearCollection(collectionName: string): Promise<void> {
  const response = await fetch(
    `http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/${collectionName}`,
    {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer owner'
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to clear collection ${collectionName}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Clear specific document from Firestore emulator
 * @param collectionName Name of the collection
 * @param documentId ID of the document to clear
 * @returns Promise that resolves when document is cleared
 */
export async function clearDocument(collectionName: string, documentId: string): Promise<void> {
  const response = await fetch(
    `http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/${collectionName}/${documentId}`,
    {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer owner'
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to clear document ${collectionName}/${documentId}: ${response.status} ${response.statusText}`);
  }
}

/**
 * Get all documents from a collection (useful for debugging)
 * @param collectionName Name of the collection
 * @returns Promise that resolves to array of document data
 */
export async function getAllDocuments(collectionName: string): Promise<any[]> {
  const response = await fetch(
    `http://localhost:8080/v1/projects/th-stray/databases/(default)/documents/${collectionName}`,
    {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer owner'
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get documents from ${collectionName}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { documents?: any[] };
  return data.documents || [];
}

/**
 * Check if Firestore emulator is running
 * @returns Promise that resolves to true if emulator is running
 */
export async function isFirestoreEmulatorRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
} 