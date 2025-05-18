// functions/src/index.ts
import "reflect-metadata";
import { instanceToPlain, plainToInstance, Type } from "class-transformer";
import {
  validate,
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from "class-validator";
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { checkAuthorization } from "./utils/auth";
import {
  Report,
  ReportStatus,
  CatType,
  LocationDto,
  ReportData,
} from "./domain/Report";

admin.initializeApp();
const db = admin.firestore();

// ── DTOs & Validation ─────────────────────────────────────────────────────
class CreateReportDto {
  @IsNumber() numberOfCats!: number;
  @IsEnum(CatType) type!: CatType;
  @IsString() contactPhone!: string;
  description?: string;
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) images!: string[];
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

class UpdateReportDto {
  @IsNumber() numberOfCats!: number;
  @IsEnum(CatType) type!: CatType;
  @IsString() contactPhone!: string;
  description?: string;
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) images!: string[];
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

class UpdateReportRequestDto {
  @IsString() reportId!: string;
  @ValidateNested()
  @Type(() => UpdateReportDto)
  data!: UpdateReportDto;
}

class StatusChangeRequestDto {
  @IsString() reportId!: string;
  @IsString() remark!: string;
}

// ── Handlers ────────────────────────────────────────────────────────────────
export const createReport = functions.https.onCall(async (req) => {
  logger.info("createReport:", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "createReport");
  const dto = plainToInstance(CreateReportDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  try {
    const timestamp = new Date();
    const report = new Report({
      ...instanceToPlain(dto),
      uid,
      status: ReportStatus.pending,
      createdAt: timestamp,
      updatedAt: timestamp,
      statusHistory: [],
    });

    const ref = await db.collection("reports").add(report.toFirestore());
    logger.info("created report", { id: ref.id });
    return { id: ref.id };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not create report ${e} with data`);
  }
});

export const listMyReports = functions.https.onCall(async (req) => {
  logger.info("listMyReports", { uid: req.auth?.uid });
  const uid = await checkAuthorization(req, "listMyReports");
  try {
    const snap = await db
      .collection("reports")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    logger.info("fetched reports", { count: results.length });
    return results;
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not fetch reports. Error: ${e}`);
  }
});

export const updateReport = functions.https.onCall(async (req) => {
  logger.info("updateReport", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "updateReport");

  const dto = plainToInstance(UpdateReportRequestDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  const reportRef = db.collection("reports").doc(dto.reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found");
  }

  const reportData = reportDoc.data() as unknown as Omit<ReportData, "id"> & {
    createdAt: { toDate(): Date };
    updatedAt: { toDate(): Date };
  };
  const report = Report.fromFirestore(dto.reportId, reportData);

  if (report.data.uid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "You can only edit your own reports",
    );
  }

  if (
    report.data.status === ReportStatus.completed ||
    report.data.status === ReportStatus.cancelled
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Cannot edit reports that are completed or cancelled",
    );
  }

  try {
    const updatedReport = report.updateDetails(instanceToPlain(dto.data));
    await reportRef.update(updatedReport.toFirestore());

    logger.info("updated report", { id: dto.reportId });
    return { id: dto.reportId };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not update report. Error: ${e}`);
  }
});

export const cancelReport = functions.https.onCall(async (req) => {
  logger.info("cancelReport", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "cancel");

  const dto = plainToInstance(StatusChangeRequestDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  const reportRef = db.collection("reports").doc(dto.reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found");
  }

  const reportData = reportDoc.data() as unknown as Omit<ReportData, "id"> & {
    createdAt: { toDate(): Date };
    updatedAt: { toDate(): Date };
  };
  const report = Report.fromFirestore(dto.reportId, reportData);

  if (report.data.uid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "You can only cancel your own reports",
    );
  }

  try {
    const cancelledReport = report.cancel(uid, dto.remark);
    await reportRef.update(cancelledReport.toFirestore());

    logger.info("cancelled report", { id: dto.reportId });
    return { id: dto.reportId };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not cancel report. Error: ${e}`);
  }
});

export const putReportOnHold = functions.https.onCall(async (req) => {
  logger.info("putReportOnHold", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "putOnHold");

  const dto = plainToInstance(StatusChangeRequestDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  const reportRef = db.collection("reports").doc(dto.reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found");
  }

  const reportData = reportDoc.data() as unknown as Omit<ReportData, "id"> & {
    createdAt: { toDate(): Date };
    updatedAt: { toDate(): Date };
  };
  const report = Report.fromFirestore(dto.reportId, reportData);

  try {
    const updatedReport = report.putOnHold(uid, dto.remark);
    await reportRef.update(updatedReport.toFirestore());

    logger.info("put report on hold", { id: dto.reportId });
    return { id: dto.reportId };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError(
      "internal",
      `Could not put report on hold. Error: ${e}`,
    );
  }
});

export const resumeReport = functions.https.onCall(async (req) => {
  logger.info("resumeReport", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "resume");

  const dto = plainToInstance(StatusChangeRequestDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  const reportRef = db.collection("reports").doc(dto.reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found");
  }

  const reportData = reportDoc.data() as unknown as Omit<ReportData, "id"> & {
    createdAt: { toDate(): Date };
    updatedAt: { toDate(): Date };
  };
  const report = Report.fromFirestore(dto.reportId, reportData);

  try {
    const updatedReport = report.resume(uid, dto.remark);
    await reportRef.update(updatedReport.toFirestore());

    logger.info("resumed report", { id: dto.reportId });
    return { id: dto.reportId };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not resume report. Error: ${e}`);
  }
});

export const completeReport = functions.https.onCall(async (req) => {
  logger.info("completeReport", { uid: req.auth?.uid, data: req.data });
  const uid = await checkAuthorization(req, "complete");

  const dto = plainToInstance(StatusChangeRequestDto, req.data);
  const errs = await validate(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }

  const reportRef = db.collection("reports").doc(dto.reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found");
  }

  const reportData = reportDoc.data() as unknown as Omit<ReportData, "id"> & {
    createdAt: { toDate(): Date };
    updatedAt: { toDate(): Date };
  };
  const report = Report.fromFirestore(dto.reportId, reportData);

  try {
    const updatedReport = report.complete(uid, dto.remark);
    await reportRef.update(updatedReport.toFirestore());

    logger.info("completed report", { id: dto.reportId });
    return { id: dto.reportId };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not complete report. Error: ${e}`);
  }
});
