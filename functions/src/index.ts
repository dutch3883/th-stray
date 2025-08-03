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
  IsOptional,
  IsBoolean,
} from "class-validator";
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { checkAuthorization } from "./utils/auth";
import { getUsersByIds, getUserRole } from "./services/roleService";
import {
  Report,
  ReportStatus,
  CatType,
  LocationDto,
  FirestoreReportData,
  ResidentType,
} from "./domain/Report";

admin.initializeApp();
const db = admin.firestore();

// Add this function to get the next report ID
async function getNextReportId(): Promise<number> {
  const counterRef = db.collection("counters").doc("reports");

  try {
    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists) {
        // Initialize counter if it doesn't exist
        transaction.set(counterRef, { currentId: 1 });
        return 1;
      }

      const currentId = counterDoc.data()?.currentId || 0;
      const nextId = currentId + 1;

      // Update the counter
      transaction.update(counterRef, { currentId: nextId });

      return nextId;
    });

    return result;
  } catch (error) {
    logger.error("Error getting next report ID:", error);
    throw new HttpsError("internal", "Could not generate report ID");
  }
}

// ── DTOs & Validation ─────────────────────────────────────────────────────
class CreateReportDto {
  @IsNumber() numberOfCats!: number;
  @IsEnum(CatType) type!: CatType;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() lineId?: string;
  @IsOptional() @IsString() whatsApp?: string;
  description?: string;
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) images!: string[];
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
  @IsBoolean() isEmergency!: boolean;
  @IsEnum(ResidentType) residentType!: ResidentType;
  @IsOptional() @IsString() socialMedia?: string;
  @IsString() problem!: string;
  @IsOptional() @IsString() additionalLocationDetails?: string;
  @IsBoolean() canSpeakEnglish!: boolean;
}

class UpdateReportDto {
  @IsNumber() numberOfCats!: number;
  @IsEnum(CatType) type!: CatType;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() lineId?: string;
  @IsOptional() @IsString() whatsApp?: string;
  description?: string;
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) images!: string[];
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
  @IsBoolean() isEmergency!: boolean;
  @IsEnum(ResidentType) residentType!: ResidentType;
  @IsOptional() @IsString() socialMedia?: string;
  @IsString() problem!: string;
  @IsOptional() @IsString() additionalLocationDetails?: string;
  @IsBoolean() canSpeakEnglish!: boolean;
}

class UpdateReportRequestDto {
  @IsNumber() reportId!: number;
  @ValidateNested()
  @Type(() => UpdateReportDto)
  data!: UpdateReportDto;
}

class StatusChangeRequestDto {
  @IsNumber() reportId!: number;
  @IsString() remark!: string;
}

class ListReportsRequestDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
  @IsOptional()
  @IsEnum(CatType)
  type?: CatType;

  @IsString()
  sortBy: string = "createdAt";

  @IsString()
  sortOrder: "asc" | "desc" = "desc";
}

// ── Handlers ────────────────────────────────────────────────────────────────
export const createReport = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Manual validation: ensure at least one contact field is provided
    if (!dto.contactPhone && !dto.lineId && !dto.whatsApp) {
      logger.warn("No contact information provided");
      throw new HttpsError(
        "invalid-argument",
        "At least one contact method (contactPhone, lineId, or whatsApp) must be provided",
      );
    }

    try {
      const timestamp = new Date();
      const reportId = await getNextReportId();

      const report = new Report({
        ...instanceToPlain(dto),
        uid,
        status: ReportStatus.pending,
        createdAt: timestamp,
        updatedAt: timestamp,
        statusHistory: [],
        reportId,
      });

      // Create the document with a random ID
      const docRef = db.collection("reports").doc();
      await docRef.set(report.toFirestore());
      logger.info("created report", { id: reportId, docId: docRef.id });
      return serializeResponse({ id: reportId });
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError(
        "internal",
        `Could not create report ${e} with data`,
      );
    }
  },
);

export const listMyReports = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
    logger.info("listMyReports", { uid: req.auth?.uid });
    const uid = await checkAuthorization(req, "listMyReports");
    try {
      const snap = await db
        .collection("reports")
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();
      const results = snap.docs.map((doc) => {
        const data = doc.data() as unknown as FirestoreReportData;
        return {
          id: data.reportId,
          ...(() => {
            const report = Report.fromFirestore(data.reportId, data).data;
            const plain = instanceToPlain(report);
            return plain;
          })(),
        };
      });
      logger.info("fetched reports", { count: results.length });
      return serializeResponse(results);
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not fetch reports. Error: ${e}`);
    }
  },
);

export const updateReport = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Manual validation: ensure at least one contact field is provided
    if (!dto.data.contactPhone && !dto.data.lineId && !dto.data.whatsApp) {
      logger.warn("No contact information provided in update");
      throw new HttpsError(
        "invalid-argument",
        "At least one contact method (contactPhone, lineId, or whatsApp) must be provided",
      );
    }

    // Find the report by reportId
    const reportsRef = db.collection("reports");
    const querySnapshot = await reportsRef
      .where("reportId", "==", dto.reportId)
      .get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportDoc = querySnapshot.docs[0];
    const reportData = reportDoc.data() as FirestoreReportData;
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
      await reportDoc.ref.update(updatedReport.toFirestore());

      logger.info("updated report", { id: dto.reportId });
      return serializeResponse({ id: dto.reportId });
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not update report. Error: ${e}`);
    }
  },
);

export const cancelReport = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Find the report by reportId
    const reportsRef = db.collection("reports");
    const querySnapshot = await reportsRef
      .where("reportId", "==", dto.reportId)
      .get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportDoc = querySnapshot.docs[0];
    const reportData = reportDoc.data() as FirestoreReportData;
    const report = Report.fromFirestore(dto.reportId, reportData);

    if (report.data.uid !== uid) {
      throw new HttpsError(
        "permission-denied",
        "You can only cancel your own reports",
      );
    }

    try {
      const cancelledReport = report.cancel(uid, dto.remark);
      await reportDoc.ref.update(cancelledReport.toFirestore());

      logger.info("cancelled report", { id: dto.reportId });
      return serializeResponse(instanceToPlain(cancelledReport.data));
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not cancel report. Error: ${e}`);
    }
  },
);

export const putReportOnHold = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Find the report by reportId
    const reportsRef = db.collection("reports");
    const querySnapshot = await reportsRef
      .where("reportId", "==", dto.reportId)
      .get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportDoc = querySnapshot.docs[0];
    const reportData = reportDoc.data() as FirestoreReportData;
    const report = Report.fromFirestore(dto.reportId, reportData);

    try {
      const updatedReport = report.putOnHold(uid, dto.remark);
      await reportDoc.ref.update(updatedReport.toFirestore());

      logger.info("put report on hold", { id: dto.reportId });
      return serializeResponse(instanceToPlain(updatedReport.data));
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError(
        "internal",
        `Could not put report on hold. Error: ${e}`,
      );
    }
  },
);

export const resumeReport = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Find the report by reportId
    const reportsRef = db.collection("reports");
    const querySnapshot = await reportsRef
      .where("reportId", "==", dto.reportId)
      .get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportDoc = querySnapshot.docs[0];
    const reportData = reportDoc.data() as FirestoreReportData;
    const report = Report.fromFirestore(dto.reportId, reportData);

    try {
      const updatedReport = report.resume(uid, dto.remark);
      await reportDoc.ref.update(updatedReport.toFirestore());

      logger.info("resumed report", { id: dto.reportId });
      return serializeResponse(instanceToPlain(updatedReport.data));
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not resume report. Error: ${e}`);
    }
  },
);

export const completeReport = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
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

    // Find the report by reportId
    const reportsRef = db.collection("reports");
    const querySnapshot = await reportsRef
      .where("reportId", "==", dto.reportId)
      .get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportDoc = querySnapshot.docs[0];
    const reportData = reportDoc.data() as FirestoreReportData;
    const report = Report.fromFirestore(dto.reportId, reportData);

    try {
      const updatedReport = report.complete(uid, dto.remark);
      await reportDoc.ref.update(updatedReport.toFirestore());

      logger.info("completed report", { id: dto.reportId });
      return serializeResponse(instanceToPlain(updatedReport.data));
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError(
        "internal",
        `Could not complete report. Error: ${e}`,
      );
    }
  },
);

export const getUserRoleFunction = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
    logger.info("getUserRole", { uid: req.auth?.uid });
    const uid = await checkAuthorization(req, "getUserRole");

    try {
      const role = await getUserRole(uid);
      logger.info("fetched user role", { uid, role });
      return serializeResponse({ role });
    } catch (e) {
      logger.error("error getting user role", e);
      throw new HttpsError("internal", `Could not get user role. Error: ${e}`);
    }
  },
);

function serializeResponse<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const listReports = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
    const startTime = Date.now();
    logger.info("listReports started", { uid: req.auth?.uid, data: req.data });

    // Step 1: Authorization
    const authStartTime = Date.now();
    await checkAuthorization(req, "listReports");
    const authEndTime = Date.now();
    logger.info("listReports - authorization completed", {
      duration: authEndTime - authStartTime + "ms",
    });

    // Step 2: Validation
    const validationStartTime = Date.now();
    const dto = plainToInstance(ListReportsRequestDto, req.data);
    const errs = await validate(dto);
    if (errs.length) {
      logger.warn("validation failed", { errs });
      throw new HttpsError(
        "invalid-argument",
        `Invalid data ${JSON.stringify(errs)}`,
      );
    }
    const validationEndTime = Date.now();
    logger.info("listReports - validation completed", {
      duration: validationEndTime - validationStartTime + "ms",
    });

    try {
      // Step 3: Query building
      const queryBuildStartTime = Date.now();
      let query: admin.firestore.Query = db.collection("reports");

      // Apply filters if provided
      if (dto.status) {
        query = query.where("status", "==", dto.status);
      }
      if (dto.type) {
        query = query.where("type", "==", dto.type);
      }
      const queryBuildEndTime = Date.now();
      logger.info("listReports - query building completed", {
        duration: queryBuildEndTime - queryBuildStartTime + "ms",
        hasStatusFilter: !!dto.status,
        hasTypeFilter: !!dto.type,
        sortBy: dto.sortBy,
        sortOrder: dto.sortOrder,
      });

      let reports: Array<{ id: number } & Record<string, unknown>>;

      // Step 4: Firestore execution and data transformation
      const firestoreStartTime = Date.now();

      // Apply sorting manually if filters are present
      if (dto.status || dto.type) {
        logger.info("listReports - using manual sorting due to filters");

        // Get all documents that match the filters
        const snapshot = await query.get();
        const firestoreQueryEndTime = Date.now();
        logger.info("listReports - filtered query executed", {
          duration: firestoreQueryEndTime - firestoreStartTime + "ms",
          documentCount: snapshot.docs.length,
        });

        // Transform documents
        const transformStartTime = Date.now();
        reports = snapshot.docs.map((doc) => {
          const data = doc.data() as unknown as FirestoreReportData;
          return {
            id: data.reportId,
            ...(() => {
              const report = Report.fromFirestore(data.reportId, data).data;
              const plain = instanceToPlain(report);
              return plain;
            })(),
          };
        });
        const transformEndTime = Date.now();
        logger.info("listReports - document transformation completed", {
          duration: transformEndTime - transformStartTime + "ms",
          reportCount: reports.length,
        });

        // Manual sorting
        const sortStartTime = Date.now();
        reports.sort((a, b) => {
          const aValue = a[dto.sortBy as keyof typeof a];
          const bValue = b[dto.sortBy as keyof typeof b];

          // Type-safe comparison function
          const compareValues = (valA: unknown, valB: unknown): number => {
            // Handle null/undefined cases
            if (valA == null && valB == null) return 0;
            if (valA == null) return -1;
            if (valB == null) return 1;

            // Convert to comparable values
            const a =
              typeof valA === "object" && valA !== null && "toISOString" in valA
                ? (valA as Date).toISOString()
                : String(valA);
            const b =
              typeof valB === "object" && valB !== null && "toISOString" in valB
                ? (valB as Date).toISOString()
                : String(valB);

            return a < b ? -1 : a > b ? 1 : 0;
          };

          const comparison = compareValues(aValue, bValue);
          return dto.sortOrder === "asc" ? comparison : -comparison;
        });
        const sortEndTime = Date.now();
        logger.info("listReports - manual sorting completed", {
          duration: sortEndTime - sortStartTime + "ms",
        });
      } else {
        logger.info("listReports - using Firestore built-in sorting");

        // If no filters, use Firestore's built-in sorting
        query = query.orderBy(dto.sortBy, dto.sortOrder);
        const sortedSnapshot = await query.get();
        const firestoreQueryEndTime = Date.now();
        logger.info("listReports - sorted query executed", {
          duration: firestoreQueryEndTime - firestoreStartTime + "ms",
          documentCount: sortedSnapshot.docs.length,
        });

        // Transform documents
        const transformStartTime = Date.now();
        reports = sortedSnapshot.docs.map((doc) => {
          const data = doc.data() as unknown as FirestoreReportData;
          return {
            id: data.reportId,
            ...(() => {
              const report = Report.fromFirestore(data.reportId, data).data;
              const plain = instanceToPlain(report);
              return plain;
            })(),
          };
        });
        const transformEndTime = Date.now();
        logger.info("listReports - document transformation completed", {
          duration: transformEndTime - transformStartTime + "ms",
          reportCount: reports.length,
        });
      }

      const firestoreEndTime = Date.now();
      logger.info("listReports - Firestore operations completed", {
        duration: firestoreEndTime - firestoreStartTime + "ms",
      });

      // Step 5: Extract unique user IDs
      const userIdExtractionStartTime = Date.now();
      const userIds = [
        ...new Set(
          reports.map((report) => (report as unknown as { uid: string }).uid),
        ),
      ];
      const userIdExtractionEndTime = Date.now();
      logger.info("listReports - user ID extraction completed", {
        duration: userIdExtractionEndTime - userIdExtractionStartTime + "ms",
        uniqueUserCount: userIds.length,
      });

      // Step 6: Fetch user details
      const userFetchStartTime = Date.now();
      const users = await getUsersByIds(userIds);
      const userFetchEndTime = Date.now();
      logger.info("listReports - user details fetched", {
        duration: userFetchEndTime - userFetchStartTime + "ms",
        requestedUsers: userIds.length,
        fetchedUsers: users.length,
      });

      // Step 7: Create user map and add user info to reports
      const userMappingStartTime = Date.now();
      const userMap = new Map(users.map((user) => [user.uid, user]));

      // Add user information to each report
      const reportsWithUsers = reports.map((report) => ({
        ...report,
        user: userMap.get((report as unknown as { uid: string }).uid) || null,
      }));
      const userMappingEndTime = Date.now();
      logger.info("listReports - user mapping completed", {
        duration: userMappingEndTime - userMappingStartTime + "ms",
      });

      // Step 8: Serialize response
      const serializationStartTime = Date.now();
      const result = serializeResponse(reportsWithUsers);
      const serializationEndTime = Date.now();
      logger.info("listReports - serialization completed", {
        duration: serializationEndTime - serializationStartTime + "ms",
      });

      const totalEndTime = Date.now();
      logger.info("listReports completed successfully", {
        totalDuration: totalEndTime - startTime + "ms",
        finalReportCount: reportsWithUsers.length,
        breakdown: {
          authorization: authEndTime - authStartTime + "ms",
          validation: validationEndTime - validationStartTime + "ms",
          queryBuilding: queryBuildEndTime - queryBuildStartTime + "ms",
          firestoreOps: firestoreEndTime - firestoreStartTime + "ms",
          userIdExtraction:
            userIdExtractionEndTime - userIdExtractionStartTime + "ms",
          userFetch: userFetchEndTime - userFetchStartTime + "ms",
          userMapping: userMappingEndTime - userMappingStartTime + "ms",
          serialization: serializationEndTime - serializationStartTime + "ms",
        },
      });

      return result;
    } catch (e) {
      const errorTime = Date.now();
      logger.error("listReports failed", {
        error: e,
        totalDurationBeforeError: errorTime - startTime + "ms",
      });
      throw new HttpsError("internal", `Could not fetch reports. Error: ${e}`);
    }
  },
);

export const countAllReports = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
    logger.info("countAllReports", { uid: req.auth?.uid, data: req.data });
    await checkAuthorization(req, "listReports");

    const dto = plainToInstance(ListReportsRequestDto, req.data);
    const errs = await validate(dto);
    if (errs.length) {
      logger.warn("validation failed", { errs });
      throw new HttpsError(
        "invalid-argument",
        `Invalid data ${JSON.stringify(errs)}`,
      );
    }

    try {
      let query: admin.firestore.Query = db.collection("reports");

      // Apply filters if provided
      if (dto.status) {
        query = query.where("status", "==", dto.status);
      }
      if (dto.type) {
        query = query.where("type", "==", dto.type);
      }

      const snapshot = await query.count().get();
      const count = snapshot.data().count;

      logger.info("counted reports", { count });
      return serializeResponse({ count });
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not count reports. Error: ${e}`);
    }
  },
);

export const countMyReports = functions.https.onCall(
  { region: "asia-northeast1" },
  async (req) => {
    logger.info("countMyReports", { uid: req.auth?.uid });
    const uid = await checkAuthorization(req, "listMyReports");

    try {
      const snapshot = await db
        .collection("reports")
        .where("uid", "==", uid)
        .count()
        .get();

      const count = snapshot.data().count;
      logger.info("counted my reports", { count });
      return serializeResponse({ count });
    } catch (e) {
      logger.error("firestore error", e);
      throw new HttpsError("internal", `Could not count reports. Error: ${e}`);
    }
  },
);
