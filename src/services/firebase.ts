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
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress non-critical connection retry warnings in offline/sandbox environments
try {
  setLogLevel('error');
} catch {
  // Ignore if log level setting fails in some environments
}

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID from config and resilient transport
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
}

/**
 * Gets a specific activation request by deviceId
 */
export async function getActivationRequest(deviceId: string): Promise<ActivationRequest | null> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as ActivationRequest;
  }
  return null;
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
      console.warn("Firestore listening error (likely offline):", error);
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
      console.warn("Firestore loading requests error (likely offline):", error);
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
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  await updateDoc(docRef, {
    status: 'approved',
    licenseKey,
    durationDays,
    approvedAt: new Date().toISOString()
  });
}

/**
 * Rejects a user's activation request
 */
export async function rejectRequestInCloud(deviceId: string, rejectReason?: string): Promise<void> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  await updateDoc(docRef, {
    status: 'rejected',
    approvedAt: null,
    licenseKey: null,
    rejectReason: rejectReason || ''
  });
}

/**
 * Deletes a request from Firestore
 */
export async function deleteRequestFromCloud(deviceId: string): Promise<void> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  await deleteDoc(docRef);
}
