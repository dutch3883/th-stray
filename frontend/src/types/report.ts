export enum ReportStatus {
  PENDING = 'pending',
  ON_HOLD = 'onHold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CatType {
  STRAY = 'stray',
  INJURED = 'injured',
  SICK = 'sick',
  KITTEN = 'kitten'
}

// Base location interface
export interface Location {
  lat: number;
  long: number;
  description: string;
}

// DTO for API responses
export interface ReportDTO {
  id: number;
  status: ReportStatus;
  type: CatType;
  numberOfCats: number;
  contactPhone: string;
  description?: string;
  images: string[];
  location: Location;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: Array<{
    from: ReportStatus;
    to: ReportStatus;
    changedAt: Date;
    changedBy: string;
    remark: string;
  }>;
}

// Domain model
export interface Report extends ReportDTO {} 