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
  id: string;
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
    status: ReportStatus;
    remark: string;
    updatedBy: string;
    updatedAt: Date;
  }>;
}

// Domain model
export interface Report extends ReportDTO {} 