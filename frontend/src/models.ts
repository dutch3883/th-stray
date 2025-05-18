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
    description?: string;
    images: string[];            // base64 URLs or uploaded URLs
    location: Location;
    status: 'pending' | 'onHold' | 'completed' | 'cancelled';
    createdAt: FirebaseTimestamp;
    updatedAt?: FirebaseTimestamp;
    adminNote?: string;
    photoUrl?: string;
  }

  // Firebase Timestamp type
  export interface FirebaseTimestamp {
    _seconds: number;
    _nanoseconds: number;
  }