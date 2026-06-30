import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config if present
export const cloudDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

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
}

/**
 * Creates or updates an activation request in Firestore
 */
export async function submitActivationRequest(deviceId: string, storeName: string, phone: string): Promise<void> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  const requestData: ActivationRequest = {
    id: deviceId,
    deviceId,
    storeName: storeName || 'محل تجاري جديد',
    phone: phone || '',
    requestedAt: new Date().toISOString(),
    status: 'pending'
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
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as ActivationRequest);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Firestore listening error:", error);
  });
}

/**
 * Subscribes to all activation requests (for the developer/admin dashboard)
 */
export function subscribeToAllActivationRequests(callback: (requests: ActivationRequest[]) => void) {
  const q = query(collection(cloudDb, 'activation_requests'), orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const requests: ActivationRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push(doc.data() as ActivationRequest);
    });
    callback(requests);
  }, (error) => {
    console.error("Firestore loading requests error:", error);
  });
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
export async function rejectRequestInCloud(deviceId: string): Promise<void> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  await updateDoc(docRef, {
    status: 'rejected',
    approvedAt: null,
    licenseKey: null
  });
}

/**
 * Deletes a request from Firestore
 */
export async function deleteRequestFromCloud(deviceId: string): Promise<void> {
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  await deleteDoc(docRef);
}
