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
import { checkAuth } from "./utils/auth";

admin.initializeApp();
const db = admin.firestore();

// ── DTOs & Validation ─────────────────────────────────────────────────────
export enum CatType {
  stray = "stray",
  injured = "injured",
  sick = "sick",
  kitten = "kitten",
}

class LocationDto {
  @IsNumber() lat!: number;
  @IsNumber() long!: number;
  @IsString() description!: string;
}

class CreateReportDto {
  @IsNumber() numberOfCats!: number;
  @IsEnum(CatType) type!: CatType;
  @IsString() contactPhone!: string;
  @IsString() description!: string;
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) images!: string[];
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

// ── Handlers ────────────────────────────────────────────────────────────────
export const createReport = functions.https.onCall(async (req) => {
  logger.info("createReport", { uid: req.auth?.uid, data: req.data });
  const uid = checkAuth(req);
  const dto = plainToInstance(CreateReportDto, req.data);
  const errs = await validate(dto);
  const plain = instanceToPlain(dto);
  if (errs.length) {
    logger.warn("validation failed", { errs });
    throw new HttpsError(
      "invalid-argument",
      `Invalid data ${JSON.stringify(errs)}`,
    );
  }
  try {
    logger.info(`try create with ${plain}`);
    const ref = await db.collection("reports").add({
      ...plain,
      uid,
      status: "pending",
      createdAt: new Date(),
    });
    logger.info("created report", { id: ref.id });
    return { id: ref.id };
  } catch (e) {
    logger.error("firestore error", e);
    throw new HttpsError("internal", `Could not create report ${e} with data`);
  }
});

export const listMyReports = functions.https.onCall(async (req) => {
  logger.info("listMyReports", { uid: req.auth?.uid });
  const uid = checkAuth(req);
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
