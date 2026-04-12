/**
 * CT Command Portal — Firebase Auth + Firestore role check,
 * or optional dummy login (see firebase-config.js).
 */
var PAUD_DUMMY_SESSION_KEY = "paud_operator_dummy_ok";
/**
 * Root deploy (e.g. Vercel): site lives at /. Local/dev may use /operator_portal/.
 */
var PAUD_PORTAL_BASE;
var PAUD_LOGIN_PATH;
(function initPaudPortalPaths() {
  var path = (typeof window !== "undefined" && window.location && window.location.pathname) || "";
  if (path.indexOf("/operator_portal") === 0) {
    PAUD_PORTAL_BASE = "/operator_portal/";
    PAUD_LOGIN_PATH = "/operator_portal/login.html";
    return;
  }
  PAUD_PORTAL_BASE = "/";
  PAUD_LOGIN_PATH = "/login.html";
})();

function isDummyAuthEnabled() {
  var d = window.__OPERATOR_DUMMY_AUTH__;
  return !!(d && d.enabled === true);
}

function isDummySessionActive() {
  try {
    return sessionStorage.getItem(PAUD_DUMMY_SESSION_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function setDummySession() {
  try {
    sessionStorage.setItem(PAUD_DUMMY_SESSION_KEY, "1");
  } catch (_) {}
}

function clearDummySession() {
  try {
    sessionStorage.removeItem(PAUD_DUMMY_SESSION_KEY);
  } catch (_) {}
}

(function initFirebaseIfNeeded() {
  if (isDummyAuthEnabled()) {
    return;
  }
  const cfg = window.__FIREBASE_CONFIG__;
  if (!cfg || !cfg.apiKey) {
    console.error(
      "[CT Portal] Missing firebase-config.js — operators cannot sign in until it is configured."
    );
    return;
  }
  const cleaned = {};
  Object.keys(cfg).forEach(function (k) {
    var v = cfg[k];
    if (v !== "" && v !== null && v !== undefined) {
      cleaned[k] = v;
    }
  });
  try {
    firebase.initializeApp(cleaned);
  } catch (e) {
    console.error("[CT Portal] Firebase init failed:", e);
  }
})();

/**
 * Only users with Firestore users/{uid}.role === "operator" may use this portal.
 * Rejects with the Firestore error when rules deny read (so callers can show a rules hint).
 */
function verifyOperatorRole(uid) {
  if (typeof window.__paudVerifyOperatorRole === "function") {
    return window.__paudVerifyOperatorRole(uid);
  }
  if (typeof firebase === "undefined" || !firebase.firestore) {
    return Promise.resolve(false);
  }
  return firebase
    .firestore()
    .collection("users")
    .doc(uid)
    .get()
    .then(function (snap) {
      if (!snap.exists) return false;
      const role = snap.data().role;
      return role === "operator";
    })
    .catch(function (err) {
      console.error("[CT Portal] Firestore read failed:", err);
      if (err && err.code === "permission-denied") {
        console.error(
          "[CT Portal] Allow authenticated users to read their own users/{uid} document (see firestore.rules)."
        );
        return Promise.reject(err);
      }
      return false;
    });
}

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
}

function clearLoginError() {
  const el = document.getElementById("login-error");
  if (el) {
    el.textContent = "";
    el.hidden = true;
  }
}

function initLoginPageDummy() {
  const form = document.getElementById("operator-login-form");
  const btn = document.getElementById("operator-login-submit");
  const cfg = window.__OPERATOR_DUMMY_AUTH__;
  if (!form || !btn || !cfg) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearLoginError();

    const email = (document.getElementById("op-email") || {}).value || "";
    const password = (document.getElementById("op-password") || {}).value || "";

    if (!email.trim()) {
      showLoginError("Enter your email.");
      return;
    }
    if (!password) {
      showLoginError("Enter your password.");
      return;
    }

    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");

    var ok =
      email.trim().toLowerCase() === String(cfg.email || "").toLowerCase() &&
      password === String(cfg.password || "");

    setTimeout(function () {
      if (ok) {
        setDummySession();
        window.location.href = PAUD_PORTAL_BASE;
      } else {
        showLoginError(
          "Invalid credentials. Dummy mode: use email and password from firebase-config.js (__OPERATOR_DUMMY_AUTH__)."
        );
      }
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    }, 150);
  });
}

function initLoginPageFirebase() {
  const form = document.getElementById("operator-login-form");
  const btn = document.getElementById("operator-login-submit");
  if (!form || !btn) return;

  try {
    var q = new URLSearchParams(window.location.search);
    if (q.get("reason") === "role") {
      showLoginError(
        "Operator access only. This account is not registered as an operator."
      );
    } else if (q.get("reason") === "config") {
      showLoginError(
        "Portal configuration error. Check firebase-config.js and the browser console."
      );
    } else if (q.get("reason") === "rules") {
      showLoginError(
        "Firestore blocked reading your profile. Deploy firestore.rules (see repo root) or update rules in Firebase Console."
      );
    }
  } catch (_) {}

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearLoginError();

    const email = (document.getElementById("op-email") || {}).value || "";
    const password = (document.getElementById("op-password") || {}).value || "";

    if (!email.trim()) {
      showLoginError("Enter your email.");
      return;
    }
    if (!password) {
      showLoginError("Enter your password.");
      return;
    }

    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");

    firebase
      .auth()
      .signInWithEmailAndPassword(email.trim(), password)
      .then(function (cred) {
        return verifyOperatorRole(cred.user.uid).then(function (ok) {
          if (!ok) {
            return firebase.auth().signOut().then(function () {
              throw new Error("OPERATOR_ONLY");
            });
          }
          window.location.href = PAUD_PORTAL_BASE;
        });
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied") {
          showLoginError(
            "Cannot verify operator profile (Firestore permission denied). Deploy firestore.rules from this project or fix rules in Firebase Console."
          );
          firebase.auth().signOut().catch(function () {});
        } else if (err && err.message === "OPERATOR_ONLY") {
          showLoginError(
            "This account is not an operator. Use an operator profile created from the companion mobile app."
          );
        } else if (err && err.code === "auth/invalid-credential") {
          showLoginError("Invalid email or password.");
        } else if (err && err.code === "auth/too-many-requests") {
          showLoginError("Too many attempts. Try again later.");
        } else {
          showLoginError(
            (err && err.message) || "Sign-in failed. Check your connection and Firebase config."
          );
        }
      })
      .finally(function () {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      });
  });
}

function initLoginPage() {
  if (isDummyAuthEnabled()) {
    initLoginPageDummy();
    return;
  }
  initLoginPageFirebase();
}

function updatePortalUserDisplay(user) {
  const un = document.querySelector(".sb-un");
  if (un && user) {
    const label = user.displayName || user.email || "Operator";
    un.textContent = "Operator: " + label;
  }
}

function wireLogoutDummy() {
  document.querySelectorAll(".logout-btn").forEach(function (el) {
    el.addEventListener("click", function () {
      clearDummySession();
      window.location.href = PAUD_LOGIN_PATH;
    });
  });
}

function initPortalGuardDummy() {
  if (!isDummySessionActive()) {
    window.location.replace(PAUD_LOGIN_PATH);
    return;
  }
  const cfg = window.__OPERATOR_DUMMY_AUTH__ || {};
  document.body.classList.remove("auth-checking");
  document.body.classList.add("auth-ready");
  updatePortalUserDisplay({
    email: cfg.email,
    displayName: cfg.displayName || "Demo Operator",
  });
  wireLogoutDummy();
}

function initPortalGuardFirebase() {
  if (typeof firebase === "undefined" || !firebase.apps.length) {
    window.location.replace(PAUD_LOGIN_PATH + "?reason=config");
    return;
  }

  const auth = firebase.auth();

  auth.onAuthStateChanged(function (user) {
    if (!user) {
      window.location.replace(PAUD_LOGIN_PATH);
      return;
    }

    verifyOperatorRole(user.uid)
      .then(function (ok) {
        if (!ok) {
          return auth.signOut().then(function () {
            window.location.replace(PAUD_LOGIN_PATH + "?reason=role");
          });
        }
        document.body.classList.remove("auth-checking");
        document.body.classList.add("auth-ready");
        updatePortalUserDisplay(user);
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied") {
          auth.signOut().then(function () {
            window.location.replace(PAUD_LOGIN_PATH + "?reason=rules");
          });
        } else {
          auth.signOut().then(function () {
            window.location.replace(PAUD_LOGIN_PATH + "?reason=role");
          });
        }
      });
  });

  document.querySelectorAll(".logout-btn").forEach(function (el) {
    el.addEventListener("click", function () {
      auth
        .signOut()
        .then(function () {
          window.location.href = PAUD_LOGIN_PATH;
        })
        .catch(function (e) {
          console.error(e);
        });
    });
  });
}

function initPortalGuard() {
  if (isDummyAuthEnabled()) {
    initPortalGuardDummy();
    return;
  }
  initPortalGuardFirebase();
}

document.addEventListener("DOMContentLoaded", function () {
  var page = document.body && document.body.getAttribute("data-page");
  if (page === "login") {
    initLoginPage();
  } else if (page === "portal") {
    initPortalGuard();
  }
});
