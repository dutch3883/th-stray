import { IsNumber, IsString } from "class-validator";
import { Transform } from "class-transformer";

export enum CatType {
  stray = "stray",
  injured = "injured",
  sick = "sick",
  kitten = "kitten",
}

export enum ReportStatus {
  pending = "pending",
  onHold = "onHold",
  completed = "completed",
  cancelled = "cancelled",
}

export class LocationDto {
  @IsNumber() lat!: number;
  @IsNumber() long!: number;
  @IsString() description!: string;
}

export interface StatusChange {
  from: ReportStatus;
  to: ReportStatus;
  changedAt: Date;
  changedBy: string;
  remark: string;
}

export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export function toDate(timestamp: FirestoreTimestamp | undefined): Date {
  if (!timestamp) return new Date();
  return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
}

export interface ReportData {
  id: string;
  uid: string;
  numberOfCats: number;
  type: CatType;
  contactPhone: string;
  description?: string;
  images: string[];
  location: LocationDto;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: StatusChange[];
}

export interface FirestoreReportData
  extends Omit<ReportData, "id" | "createdAt" | "updatedAt"> {
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export class Report {
  public readonly data: ReportData;

  constructor(data: Partial<ReportData>) {
    this.data = {
      id: data.id || "",
      uid: data.uid || "",
      numberOfCats: data.numberOfCats || 0,
      type: data.type || CatType.stray,
      contactPhone: data.contactPhone || "",
      description: data.description,
      images: data.images || [],
      location: data.location || { lat: 0, long: 0, description: "" },
      status: data.status || ReportStatus.pending,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      statusHistory: data.statusHistory || [],
    };
  }

  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  get createdAt(): Date {
    return this.data.createdAt;
  }

  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  private static canChangeStatus(
    currentStatus: ReportStatus,
    newStatus: ReportStatus,
  ): boolean {
    switch (currentStatus) {
      case ReportStatus.pending:
        return [
          ReportStatus.onHold,
          ReportStatus.cancelled,
          ReportStatus.completed,
        ].includes(newStatus);
      case ReportStatus.onHold:
        return [ReportStatus.pending].includes(newStatus);
      default:
        return false;
    }
  }

  private createStatusChange(
    newStatus: ReportStatus,
    changedBy: string,
    remark: string,
  ): StatusChange {
    const now = new Date();
    return {
      from: this.data.status,
      to: newStatus,
      changedAt: now,
      changedBy,
      remark,
    };
  }

  private applyStatusChange(
    newStatus: ReportStatus,
    changedBy: string,
    remark: string,
  ): Report {
    if (!Report.canChangeStatus(this.data.status, newStatus)) {
      throw new Error(
        `Cannot change status from ${this.data.status} to ${newStatus}`,
      );
    }

    const statusChange = this.createStatusChange(newStatus, changedBy, remark);
    const now = new Date();
    return new Report({
      ...this.data,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...this.data.statusHistory, statusChange],
    });
  }

  putOnHold(changedBy: string, remark: string): Report {
    if (this.data.status !== ReportStatus.pending) {
      throw new Error("Only pending reports can be put on hold");
    }
    return this.applyStatusChange(ReportStatus.onHold, changedBy, remark);
  }

  resume(changedBy: string, remark: string): Report {
    if (this.data.status !== ReportStatus.onHold) {
      throw new Error("Only on-hold reports can be resumed");
    }
    return this.applyStatusChange(ReportStatus.pending, changedBy, remark);
  }

  complete(changedBy: string, remark: string): Report {
    if (this.data.status !== ReportStatus.pending) {
      throw new Error("Only pending reports can be completed");
    }
    return this.applyStatusChange(ReportStatus.completed, changedBy, remark);
  }

  cancel(cancelledBy: string, remark: string): Report {
    if (this.data.status !== ReportStatus.pending) {
      throw new Error("Only pending reports can be cancelled");
    }
    return this.applyStatusChange(ReportStatus.cancelled, cancelledBy, remark);
  }

  updateDetails(
    updates: Partial<
      Omit<ReportData, "id" | "uid" | "status" | "createdAt" | "statusHistory">
    >,
  ): Report {
    const now = new Date();
    return new Report({
      ...this.data,
      ...updates,
      updatedAt: now,
    });
  }

  toFirestore(): Omit<ReportData, "id"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, description, ...rest } = this.data;
    return description === undefined ? rest : { ...rest, description };
  }

  static fromFirestore(
    id: string,
    data: FirestoreReportData | undefined,
  ): Report {
    if (!data) {
      throw new Error("Report data is undefined");
    }
    return new Report({
      id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    });
  }
}
