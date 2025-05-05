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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyReports = exports.createReport = void 0;
// functions/src/index.ts
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("./utils/auth");
admin.initializeApp(); // service account auto-injected in build
const db = admin.firestore();
/** POST /createReport  (callable) */
exports.createReport = functions.https.onCall(async (request) => {
    const uid = (0, auth_1.checkAuth)(request); // throws 401 if no ID-token
    const doc = await db.collection('reports').add({
        ...request,
        uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: doc.id };
});
/** GET /listMyReports */
exports.listMyReports = functions.https.onCall(async (request) => {
    const uid = (0, auth_1.checkAuth)(request);
    const q = db.collection('reports')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc');
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});
//# sourceMappingURL=index.js.map