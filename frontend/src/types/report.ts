export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
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
  address: string;
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