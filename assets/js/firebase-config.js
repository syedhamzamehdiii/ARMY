/**
 * Firebase Web SDK — must match the same Firebase project as the companion mobile app.
 *
 * Operator web login uses Email/Password (same accounts created in the app).
 * If sign-in fails: add a Web app in Firebase Console → Project settings → Your apps → Web,
 * then paste `appId` (and any missing fields) from the generated `firebaseConfig`.
 *
 * After changing rules, deploy: `firebase deploy --only firestore:rules`
 */
window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyClJOsm2ljBVOorPEOoFvPj-b-OFbAdQNI",
  authDomain: "army-app-8d4b1.firebaseapp.com",
  projectId: "army-app-8d4b1",
  storageBucket: "army-app-8d4b1.firebasestorage.app",
  messagingSenderId: "4588578218",
};

/** Same database id as AppConfig.firestoreDatabaseId in the Flutter app (not always "(default)"). */
window.__FIRESTORE_DATABASE_ID__ = "armyapp";

/**
 * Offline demo login (no Firebase). Set enabled to true only for static UI preview.
 * For real operator sign-in (same email/password as the app), keep this false.
 */
window.__OPERATOR_DUMMY_AUTH__ = {
  enabled: false,
  email: "operator@demo.com",
  password: "demo1234",
  displayName: "Demo Operator",
};
