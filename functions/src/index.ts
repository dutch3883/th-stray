// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin     from 'firebase-admin';
import { checkAuth }  from './utils/auth';

admin.initializeApp();                 // service account auto-injected in build

const db = admin.firestore();

/** POST /createReport  (callable) */
export const createReport = functions.https.onCall(async (data, ctx) => {
  const uid = checkAuth(ctx);          // throws 401 if no ID-token
  const doc = await db.collection('reports').add({
    ...data,
    uid,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: doc.id };
});

/** GET /listMyReports */
export const listMyReports = functions.https.onCall(async (data, ctx) => {
  const uid = checkAuth(ctx);
  const q = db.collection('reports')
              .where('uid', '==', uid)
              .orderBy('createdAt', 'desc');
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});
