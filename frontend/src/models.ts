// src/models.ts

import { Timestamp } from 'firebase/firestore';
import { Report } from './types/report';

export type FirebaseTimestamp = Timestamp;

/** Where the cat was seen */
export interface Location {
    lat: number;
    long: number;
    description: string;
  }

export type { Report };