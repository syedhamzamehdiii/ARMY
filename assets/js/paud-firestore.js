/**
 * Role check via Firestore REST API.
 * This avoids compat/modular SDK mismatch while still supporting named DBs.
 */
(function bindPaudFirestoreViaRest() {
  window.__paudVerifyOperatorRole = async function (uid) {
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
      return false;
    }
    const auth = firebase.auth();
    const user = auth && auth.currentUser;
    if (!user || user.uid !== uid) return false;

    const token = await user.getIdToken();
    const cfg = window.__FIREBASE_CONFIG__ || {};
    const projectId = cfg.projectId;
    const dbId = window.__FIRESTORE_DATABASE_ID__ || "(default)";
    if (!projectId) return false;

    const url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/" +
      encodeURIComponent(dbId) +
      "/documents/users/" +
      encodeURIComponent(uid);

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 404) return false;
    if (res.status === 401 || res.status === 403) {
      const err = new Error("Missing or insufficient permissions.");
      err.code = "permission-denied";
      throw err;
    }
    if (!res.ok) {
      return false;
    }

    const payload = await res.json();
    const roleField =
      payload &&
      payload.fields &&
      payload.fields.role &&
      (payload.fields.role.stringValue || payload.fields.role.integerValue);
    return roleField === "operator";
  };
})();
