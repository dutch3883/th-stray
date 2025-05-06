"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyReports = exports.createReport = void 0;
// functions/src/index.ts
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const auth_1 = require("./utils/auth");
admin.initializeApp();
const db = admin.firestore();
// ── DTOs & Validation ─────────────────────────────────────────────────────
var CatType;
(function (CatType) {
    CatType["stray"] = "stray";
    CatType["injured"] = "injured";
    CatType["sick"] = "sick";
    CatType["kitten"] = "kitten";
})(CatType || (CatType = {}));
class LocationDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "long", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocationDto.prototype, "description", void 0);
class CreateReportDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateReportDto.prototype, "numberOfCats", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CatType),
    __metadata("design:type", String)
], CreateReportDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateReportDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", LocationDto)
], CreateReportDto.prototype, "location", void 0);
// ── Handlers ────────────────────────────────────────────────────────────────
exports.createReport = functions.https.onCall(async (req) => {
    logger.info("createReport", { uid: req.auth?.uid, data: req.data });
    const uid = (0, auth_1.checkAuth)(req);
    const dto = (0, class_transformer_1.plainToInstance)(CreateReportDto, req.data);
    const errs = await (0, class_validator_1.validate)(dto);
    const plain = (0, class_transformer_1.instanceToPlain)(dto);
    if (errs.length) {
        logger.warn("validation failed", { errs });
        throw new https_1.HttpsError("invalid-argument", `Invalid data ${req}`);
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
    }
    catch (e) {
        logger.error("firestore error", e);
        throw new https_1.HttpsError("internal", `Could not create report ${e} with data`);
    }
});
exports.listMyReports = functions.https.onCall(async (req) => {
    logger.info("listMyReports", { uid: req.auth?.uid });
    const uid = (0, auth_1.checkAuth)(req);
    try {
        const snap = await db
            .collection("reports")
            .where("uid", "==", uid)
            .orderBy("createdAt", "desc")
            .get();
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        logger.info("fetched reports", { count: results.length });
        return results;
    }
    catch (e) {
        logger.error("firestore error", e);
        throw new https_1.HttpsError("internal", "Could not fetch reports");
    }
});
//# sourceMappingURL=index.js.map