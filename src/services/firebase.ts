import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config if present
export const cloudDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Firebase Auth
export const auth = getAuth(app);

export { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup };
export type { User };

// Standard Firestore Error Handling conforming to Firebase Integration Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Validate Connection to Firestore when the application initially boots
export async function testConnection() {
  try {
    await getDocFromServer(doc(cloudDb, '_test_connection_placeholder_', 'connection'));
    console.log("Firebase Firestore connection verified successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.toLowerCase().includes('offline')) {
      console.warn("Please check your Firebase configuration: Device appears offline.");
    } else {
      console.log("Firebase Connection initial validation checked.");
    }
  }
}
testConnection();

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
  const path = `activation_requests/${deviceId}`;
  try {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Gets a specific activation request by deviceId
 */
export async function getActivationRequest(deviceId: string): Promise<ActivationRequest | null> {
  const path = `activation_requests/${deviceId}`;
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ActivationRequest;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribes to changes on a specific device's activation request.
 * Useful for real-time auto-activation when owner approves.
 */
export function subscribeToDeviceActivation(deviceId: string, callback: (request: ActivationRequest | null) => void) {
  const path = `activation_requests/${deviceId}`;
  const docRef = doc(cloudDb, 'activation_requests', deviceId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as ActivationRequest);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

/**
 * Subscribes to all activation requests (for the developer/admin dashboard)
 */
export function subscribeToAllActivationRequests(callback: (requests: ActivationRequest[]) => void) {
  const path = 'activation_requests';
  const q = query(collection(cloudDb, 'activation_requests'), orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const requests: ActivationRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push(doc.data() as ActivationRequest);
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

/**
 * Approves a user's activation request and signs a license key
 */
export async function approveRequestInCloud(deviceId: string, durationDays: number, licenseKey: string): Promise<void> {
  const path = `activation_requests/${deviceId}`;
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await updateDoc(docRef, {
      status: 'approved',
      licenseKey,
      durationDays,
      approvedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Rejects a user's activation request
 */
export async function rejectRequestInCloud(deviceId: string): Promise<void> {
  const path = `activation_requests/${deviceId}`;
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await updateDoc(docRef, {
      status: 'rejected',
      approvedAt: null,
      licenseKey: null
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a request from Firestore
 */
export async function deleteRequestFromCloud(deviceId: string): Promise<void> {
  const path = `activation_requests/${deviceId}`;
  try {
    const docRef = doc(cloudDb, 'activation_requests', deviceId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
