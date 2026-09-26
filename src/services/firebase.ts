import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  setLogLevel
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  type User
} from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress non-critical connection retry warnings in offline/sandbox environments
try {
  setLogLevel('silent');
} catch {
  // Ignore if log level setting fails in some environments
}

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID from config and auto-detect transport
let cloudDbInstance;
try {
  cloudDbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
  }, firebaseConfig.firestoreDatabaseId || "(default)");
} catch {
  cloudDbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
}

export const cloudDb = cloudDbInstance;
export const CLOUD_PROJECT_ID = firebaseConfig.projectId;
export const CLOUD_DATABASE_ID = firebaseConfig.firestoreDatabaseId || "(default)";

// Initialize Firebase Auth
let authInstance: any = null;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth initialization warning:", e);
}

export type { User } from 'firebase/auth';
export const cloudAuth = authInstance;
export const googleAuthProvider = new GoogleAuthProvider();
try {
  googleAuthProvider.addScope('email');
  googleAuthProvider.addScope('profile');
  googleAuthProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch {}

// Initialize Firebase Analytics safely (Web & Capacitor environment)
export let cloudAnalytics: any = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      try {
        cloudAnalytics = getAnalytics(app);
      } catch (e) {
        console.warn("Firebase Analytics init warning:", e);
      }
    }
  }).catch(() => {});
}

export const OWNER_EMAIL = 'azamfahd25@gmail.com';

/**
 * Checks if a given email is the system Super Owner
 */
export function isSuperOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Signs in using Google
 */
export async function signInWithGoogle(): Promise<{ user: User; isOwner: boolean }> {
  if (!cloudAuth) {
    throw new Error('خدمة المصادقة السحابية غير متوفرة حالياً.');
  }

  // Ensure persistent authentication state across sessions
  try {
    await setPersistence(cloudAuth, indexedDBLocalPersistence);
  } catch {
    try {
      await setPersistence(cloudAuth, browserLocalPersistence);
    } catch {}
  }

  let user: User;

  try {
    const result = await signInWithPopup(cloudAuth, googleAuthProvider, browserPopupRedirectResolver);
    user = result.user;
  } catch (popupErr: any) {
    console.warn("signInWithPopup error:", popupErr);
    if (popupErr?.code === 'auth/popup-closed-by-user') {
      throw new Error('تم إغلاق نافذة تسجيل الدخول.');
    }
    if (popupErr?.code === 'auth/unauthorized-domain') {
      throw new Error('النطاق غير مصرح به في Firebase Console.');
    }
    throw popupErr;
  }

  const isOwner = isSuperOwner(user.email);

  // Sync user profile to Firestore
  try {
    const userDocRef = doc(cloudDb, 'user_profiles', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: user.displayName || 'مستخدم النظام',
      email: user.email || '',
      photoURL: user.photoURL || '',
      isOwner,
      role: isOwner ? 'owner' : 'user',
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (syncErr) {
    console.warn("Could not sync user profile to cloud:", syncErr);
  }

  return { user, isOwner };
}

/**
 * Signs out from Google Firebase Auth
 */
export async function signOutGoogle(): Promise<void> {
  if (cloudAuth) {
    await firebaseSignOut(cloudAuth);
  }
}

/**
 * Listens for auth state changes (Login / Logout / Redirect returns)
 */
export function subscribeToAuth(callback: (user: User | null, isOwner: boolean) => void): () => void {
  if (!cloudAuth) {
    callback(null, false);
    return () => {};
  }

  // Check redirect result on startup if applicable
  try {
    getRedirectResult(cloudAuth).then((result) => {
      if (result && result.user) {
        const user = result.user;
        const isOwner = isSuperOwner(user.email);
        const userDocRef = doc(cloudDb, 'user_profiles', user.uid);
        setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName || 'مستخدم النظام',
          email: user.email || '',
          photoURL: user.photoURL || '',
          isOwner,
          role: isOwner ? 'owner' : 'user',
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
        callback(user, isOwner);
      }
    }).catch((err) => {
      console.warn("getRedirectResult check error:", err);
    });
  } catch (e) {
    console.warn("getRedirectResult setup warning:", e);
  }

  return onAuthStateChanged(cloudAuth, (user) => {
    callback(user, isSuperOwner(user?.email));
  });
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isOwner?: boolean;
  role?: 'owner' | 'user';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deviceId?: string;
}

/**
 * Listens for all user profiles in Firestore (Admin/Owner only)
 */
export function subscribeToAllUserProfiles(callback: (profiles: UserProfile[]) => void): () => void {
  try {
    const colRef = collection(cloudDb, 'user_profiles');
    const q = query(colRef);
    return onSnapshot(q, (snapshot) => {
      const profiles: UserProfile[] = [];
      snapshot.forEach((doc) => {
        profiles.push(doc.data() as UserProfile);
      });
      callback(profiles);
    }, (err) => {
      console.warn("Firestore subscribeToAllUserProfiles error:", err);
      callback([]);
    });
  } catch (e) {
    console.warn("Firestore subscribeToAllUserProfiles failed:", e);
    callback([]);
    return () => {};
  }
}

export interface ActivationRequest {
  id: string; // same as deviceId
  deviceId: string;
  storeName: string;
  phone: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  licenseKey?: string;
  durationDays?: number;
  approvedAt?: string;
  rejectReason?: string;
  requestType?: 'initial' | 'renewal';
  requestedDuration?: number;
}

/**
 * Creates or updates an activation request in Firestore
 */
export async function submitActivationRequest(
  deviceId: string, 
  storeName: string, 
  phone: string,
  requestType: 'initial' | 'renewal' = 'initial',
  requestedDuration: number = 365
): Promise<void> {
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    const requestData: ActivationRequest = {
      id: deviceId,
      deviceId,
      storeName: storeName || 'محل تجاري جديد',
      phone: phone || '',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      requestType,
      requestedDuration
    };

    await setDoc(docRef, requestData, { merge: true });
  } catch (err) {
    console.warn("Firestore submitActivationRequest warning:", err);
    throw err;
  }
}

/**
 * Gets a specific activation request by deviceId
 */
export async function getActivationRequest(deviceId: string): Promise<ActivationRequest | null> {
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ActivationRequest;
    }
    return null;
  } catch (err) {
    console.warn("Firestore getActivationRequest warning:", err);
    return null;
  }
}

/**
 * Subscribes to changes on a specific device's activation request.
 * Useful for real-time auto-activation when owner approves.
 */
export function subscribeToDeviceActivation(deviceId: string, callback: (request: ActivationRequest | null) => void) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ActivationRequest);
      }
    }, (error) => {
      console.warn("Firestore listening error (handled gracefully):", error);
    });
  } catch (err) {
    console.warn("Failed to subscribe to device activation:", err);
    return () => {};
  }
}

/**
 * Subscribes to all activation requests (for the developer/admin dashboard)
 */
export function subscribeToAllActivationRequests(callback: (requests: ActivationRequest[]) => void) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  try {
    const q = query(collection(cloudDb, 'activation_requests'), orderBy('requestedAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const requests: ActivationRequest[] = [];
      querySnapshot.forEach((doc) => {
        requests.push(doc.data() as ActivationRequest);
      });
      callback(requests);
    }, (error) => {
      console.warn("Firestore loading requests error (handled gracefully):", error);
    });
  } catch (err) {
    console.warn("Failed to subscribe to all activation requests:", err);
    return () => {};
  }
}

/**
 * Approves a user's activation request and signs a license key
 */
export async function approveRequestInCloud(deviceId: string, durationDays: number, licenseKey: string): Promise<void> {
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await updateDoc(docRef, {
      status: 'approved',
      licenseKey,
      durationDays,
      approvedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Firestore approveRequestInCloud warning:", err);
    throw err;
  }
}

/**
 * Rejects a user's activation request
 */
export async function rejectRequestInCloud(deviceId: string, rejectReason?: string): Promise<void> {
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await updateDoc(docRef, {
      status: 'rejected',
      approvedAt: null,
      licenseKey: null,
      rejectReason: rejectReason || ''
    });
  } catch (err) {
    console.warn("Firestore rejectRequestInCloud warning:", err);
    throw err;
  }
}

/**
 * Deletes a request from Firestore
 */
export async function deleteRequestFromCloud(deviceId: string): Promise<void> {
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore deleteRequestFromCloud warning:", err);
    throw err;
  }
}

export interface AppVersionConfig {
  latestVersion: string;
  apkUrl: string;
  updateMessage: string;
  mandatory: boolean;
  updatedAt: string;
}

/**
 * Subscribes to app version configuration updates from Firestore.
 */
export function subscribeToAppVersion(callback: (config: AppVersionConfig | null) => void) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  try {
    const docRef = doc(cloudDb, 'app_config', 'version_info');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AppVersionConfig);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn("Firestore listening error for app version:", error);
    });
  } catch (err) {
    console.warn("Failed to subscribe to app version:", err);
    return () => {};
  }
}

/**
 * Updates the latest app version configuration in Firestore (Admin only).
 */
export async function updateLatestAppVersion(config: Omit<AppVersionConfig, 'updatedAt'>): Promise<void> {
  try {
    const docRef = doc(cloudDb, 'app_config', 'version_info');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore updateLatestAppVersion warning:", err);
    throw err;
  }
}

/**
 * Gets the latest app version configuration directly from Firestore
 */
export async function getLatestAppVersion(): Promise<AppVersionConfig | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  try {
    const docRef = doc(cloudDb, 'app_config', 'version_info');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppVersionConfig;
    }
  } catch (err) {
    console.warn("Firestore getLatestAppVersion warning:", err);
  }
  return null;
}

/**
 * Automatically ensures default app_config/version_info exists in Firestore
 */
export async function ensureDefaultAppVersionConfig(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }
  try {
    const docRef = doc(cloudDb, 'app_config', 'version_info');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        latestVersion: "1.0.5",
        apkUrl: "https://github.com/azamfahd/soparmarkit/releases/latest/download/app-release.apk",
        updateMessage: "يتوفر تحديث جديد يحتوي على تحسينات واسعة وإصلاحات ممتازة للتطبيق.",
        mandatory: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Firestore app_config/version_info created successfully!");
    }

    // Migrate owner activation record to ensure no data is lost
    const ownerDocRef = doc(cloudDb, 'activation_requests', 'GR-8BJB-3SQQ-ZVMU');
    const ownerSnap = await getDoc(ownerDocRef);
    if (!ownerSnap.exists()) {
      await setDoc(ownerDocRef, {
        id: "GR-8BJB-3SQQ-ZVMU",
        deviceId: "GR-8BJB-3SQQ-ZVMU",
        storeName: "انا المالك ",
        phone: "",
        requestType: "renewal",
        requestedDuration: 9999,
        durationDays: 9999,
        status: "approved",
        licenseKey: "LIC-270F-GR8B-679A8BD1-ZVMU",
        requestedAt: "2026-08-16T20:39:48.884Z",
        approvedAt: "2026-08-16T20:42:06.386Z"
      }, { merge: true });
      console.log("Owner record migrated to new Firestore database successfully!");
    }
  } catch (err) {
    console.warn("Firestore ensureDefaultAppVersionConfig warning:", err);
  }
}

// Automatically execute on initialization
ensureDefaultAppVersionConfig();

/**
 * Tests Firestore connectivity and measures response latency
 */
export async function testCloudConnection(): Promise<{ success: boolean; latencyMs: number; error?: string; latestConfig?: AppVersionConfig | null }> {
  const startTime = Date.now();
  try {
    const docRef = doc(cloudDb, 'app_config', 'version_info');
    const docSnap = await getDoc(docRef);
    const latency = Date.now() - startTime;
    return {
      success: true,
      latencyMs: latency,
      latestConfig: docSnap.exists() ? (docSnap.data() as AppVersionConfig) : null
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      latencyMs: latency,
      error: err?.message || 'تعذر الاتصال بقاعدة البيانات'
    };
  }
}


