// src/models.ts

/** Where the cat was seen */
export interface Location {
    lat: number;
    long: number;
    description: string;
  }
  
  /** One report entry returned from your functions */
  export interface Report {
    id: string;
    numberOfCats: number;
    type: 'stray' | 'injured' | 'sick' | 'kitten';
    contactPhone: string;
    images: string[];            // base64 URLs or uploaded URLs
    location: Location;
    status: 'pending' | 'complete' | 'cancelled';
    createdAt: string;           // ISO string or Firestore Timestamp .toDate().toISOString()
    updatedAt?: string;
    adminNote?: string;
    photoUrl?: string;
  }