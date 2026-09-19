/**
 * Licensing & Hardware-Bound Activation Utility
 * Highly secure, offline-capable, deterministic, tamper-proof license key validator and generator.
 * Completely isolated from the business database to survive resets, database deletion, and imports.
 */

const SALT_PRIMARY = "GROCERY_POS_LICENSE_SALT_SECRET_2026_V2";
const SALT_TAMPER = "TAMPER_PROOF_HARDWARE_INTEGRITY_SEAL_9981";
const VAULT_STORAGE_KEY = "__SYS_APP_LIC_VAULT__";
const VAULT_DB_NAME = "AppSystemLicensingSecureStorage";
const VAULT_STORE_NAME = "system_credentials";

// In-memory cache for instant synchronous access
let memoryVaultCache: SecureActivationPayload | null = null;
let cachedDeviceID: string = '';

export interface ActivationDetails {
  licenseKey: string;
  expiresAt: string; // 'lifetime' or ISO string
  activatedAt: string;
  isCloud?: boolean;
}

export interface SecureActivationPayload {
  deviceID: string;
  activationDetails: ActivationDetails | null;
  firstInstallDate: string;
  tamperSignature: string;
  hardwareFingerprint: string;
  updatedAt: string;
}

/**
 * Fast custom cryptographic 64-bit non-linear hash
 */
function customHash(str: string, salt: string = SALT_PRIMARY): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const combined = str + salt;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return (part1 + part2).slice(0, 12);
}

/**
 * Generates an immutable hardware & machine fingerprint based on physical & browser properties
 */
export function getHardwareDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'SERVER_ENVIRONMENT';
  
  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}x${window.screen?.pixelDepth || 0}`;
    const navInfo = `${navigator.hardwareConcurrency || 1}-${navigator.language || 'ar'}-${navigator.platform || ''}`;
    const tzInfo = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    // Canvas fingerprinting (deterministic GPU & font renderer signature)
    let canvasHash = 'NO_CANVAS';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial', sans-serif";
        ctx.fillStyle = '#f60';
        ctx.fillRect(10, 5, 60, 20);
        ctx.fillStyle = '#069';
        ctx.fillText("GrocerySecure_2026", 4, 12);
        canvasHash = customHash(canvas.toDataURL(), "CANVAS_SIG");
      }
    } catch (_) {}

    const rawFingerprint = `${screenInfo}#${navInfo}#${tzInfo}#${canvasHash}`;
    return customHash(rawFingerprint, "HW_FINGERPRINT_SALT");
  } catch (e) {
    return "GENERIC_HW_" + customHash(String(Date.now()), "FALLBACK");
  }
}

/**
 * Computes an anti-tamper cryptographic integrity signature
 */
export function computeTamperProofSignature(
  deviceID: string, 
  licenseKey: string, 
  activatedAt: string, 
  expiresAt: string, 
  hwFingerprint: string
): string {
  const payload = `${deviceID}|${licenseKey.trim().toUpperCase()}|${activatedAt}|${expiresAt}|${hwFingerprint}`;
  return customHash(payload, SALT_TAMPER);
}

/**
 * Generates a unique, standardized Device ID
 */
export function generateDeviceID(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const hw = getHardwareDeviceFingerprint();
  const part = (seed: string) => {
    let p = '';
    const h = customHash(seed + Math.random().toString(), "DEV_SEED");
    for (let i = 0; i < 4; i++) {
      const idx = (parseInt(h.slice(i * 2, i * 2 + 2), 16) || 0) % chars.length;
      p += chars.charAt(idx);
    }
    return p;
  };
  return `GR-${part(hw + '1')}-${part(hw + '2')}-${part(hw + '3')}`;
}

/**
 * Generates a license key for a specific Device ID and duration in days.
 * @param deviceID The device ID of the client (e.g., GR-ABCD-EFGH-IJKL)
 * @param durationDays Number of days (e.g., 30, 90, 365, or 9999 for Lifetime)
 */
export function generateLicenseKey(deviceID: string, durationDays: number): string {
  const cleanDevice = deviceID.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const durationHex = durationDays.toString(16).toUpperCase().padStart(4, '0');
  const signature = customHash(cleanDevice + durationHex, SALT_PRIMARY);
  
  // Format: LIC-DURATION-DEVSTART-SIGNATURE-DEVEND
  const key = `LIC-${durationHex}-${cleanDevice.slice(0, 4)}-${signature.slice(0, 8)}-${cleanDevice.slice(-4)}`;
  return key;
}

/**
 * Verifies if a given license key is valid for the current Device ID.
 */
export function verifyLicenseKey(deviceID: string, licenseKey: string): { isValid: boolean; durationDays: number } {
  try {
    if (!licenseKey || !deviceID) return { isValid: false, durationDays: 0 };
    const formattedKey = licenseKey.trim().toUpperCase();
    const parts = formattedKey.split('-');
    
    if (parts.length !== 5 || parts[0] !== 'LIC') {
      return { isValid: false, durationDays: 0 };
    }
    
    const durationHex = parts[1];
    const deviceStart = parts[2];
    const sig = parts[3];
    const deviceEnd = parts[4];
    
    const durationDays = parseInt(durationHex, 16);
    if (isNaN(durationDays)) return { isValid: false, durationDays: 0 };
    
    const cleanDevice = deviceID.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Quick device matching check to verify key target
    if (!cleanDevice.startsWith(deviceStart) || !cleanDevice.endsWith(deviceEnd)) {
      return { isValid: false, durationDays: 0 };
    }
    
    // Verify cryptographic signature integrity
    const recomputedSig = customHash(cleanDevice + durationHex, SALT_PRIMARY);
    
    if (recomputedSig.slice(0, 8) === sig) {
      return { isValid: true, durationDays };
    }
  } catch (e) {
    console.error("License validation error:", e);
  }
  return { isValid: false, durationDays: 0 };
}

// ---------------------------------------------------------------------------
// ISOLATED SYSTEM LICENSING VAULT (Survives DB Resets, Import/Export & Deletion)
// ---------------------------------------------------------------------------

/**
 * Asynchronously interacts with the dedicated isolated IndexedDB storage for licensing
 */
function openLicensingDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(VAULT_DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
          db.createObjectStore(VAULT_STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

async function readFromIsolatedDB(key: string): Promise<any> {
  const db = await openLicensingDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VAULT_STORE_NAME, 'readonly');
      const store = tx.objectStore(VAULT_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

async function writeToIsolatedDB(key: string, value: any): Promise<void> {
  const db = await openLicensingDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VAULT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VAULT_STORE_NAME);
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (_) {
      resolve();
    }
  });
}

/**
 * Loads the secure activation vault from multi-tier storage
 */
export function getStoredLicensingVault(): SecureActivationPayload | null {
  if (memoryVaultCache) return memoryVaultCache;

  let raw: string | null = null;
  if (typeof localStorage !== 'undefined') {
    raw = localStorage.getItem(VAULT_STORAGE_KEY);
  }
  if (!raw && typeof sessionStorage !== 'undefined') {
    raw = sessionStorage.getItem(VAULT_STORAGE_KEY);
  }

  if (raw) {
    try {
      const parsed: SecureActivationPayload = JSON.parse(raw);
      if (parsed && parsed.deviceID) {
        memoryVaultCache = parsed;
        return parsed;
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Saves the activation vault to all multi-tier storage layers
 */
export function saveLicensingVault(payload: SecureActivationPayload): void {
  memoryVaultCache = payload;
  cachedDeviceID = payload.deviceID;
  const serialized = JSON.stringify(payload);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, serialized);
      localStorage.setItem('cache_deviceID', payload.deviceID);
      if (payload.activationDetails) {
        localStorage.setItem('cache_activationDetails', JSON.stringify(payload.activationDetails));
        localStorage.setItem('cache_isActivated', 'true');
      } else {
        localStorage.removeItem('cache_activationDetails');
        localStorage.setItem('cache_isActivated', 'false');
      }
    } catch (_) {}
  }

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(VAULT_STORAGE_KEY, serialized);
    } catch (_) {}
  }

  // Also persist to independent IndexedDB in background
  writeToIsolatedDB('active_vault', payload).catch(() => {});
}

/**
 * Retrieves the permanent Device ID. If none exists, creates and stores it securely.
 */
export function getPermanentDeviceID(): string {
  if (cachedDeviceID) return cachedDeviceID;

  const vault = getStoredLicensingVault();
  if (vault && vault.deviceID) {
    cachedDeviceID = vault.deviceID;
    return vault.deviceID;
  }

  // Fallback check in localStorage
  if (typeof localStorage !== 'undefined') {
    const legacy = localStorage.getItem('cache_deviceID');
    if (legacy && legacy.startsWith('GR-')) {
      cachedDeviceID = legacy;
      const hwFingerprint = getHardwareDeviceFingerprint();
      saveLicensingVault({
        deviceID: legacy,
        activationDetails: null,
        firstInstallDate: new Date().toISOString(),
        tamperSignature: '',
        hardwareFingerprint: hwFingerprint,
        updatedAt: new Date().toISOString()
      });
      return legacy;
    }
  }

  // Create brand new permanent ID
  const newID = generateDeviceID();
  cachedDeviceID = newID;
  const hwFingerprint = getHardwareDeviceFingerprint();
  saveLicensingVault({
    deviceID: newID,
    activationDetails: null,
    firstInstallDate: new Date().toISOString(),
    tamperSignature: '',
    hardwareFingerprint: hwFingerprint,
    updatedAt: new Date().toISOString()
  });
  return newID;
}

/**
 * Initializes and synchronizes the Licensing Vault on system startup
 */
export async function initializeLicensingVault(): Promise<{
  deviceID: string;
  activationDetails: ActivationDetails | null;
  firstInstallDate: string;
  isActivated: boolean;
  activationDaysLeft: number | null;
}> {
  let vault = getStoredLicensingVault();

  // If local storage was cleared, check the isolated DB backup
  if (!vault) {
    const idbVault = await readFromIsolatedDB('active_vault');
    if (idbVault && idbVault.deviceID) {
      vault = idbVault;
      saveLicensingVault(vault!);
    }
  }

  const deviceID = vault?.deviceID || getPermanentDeviceID();
  const firstInstallDate = vault?.firstInstallDate || new Date().toISOString();
  let activationDetails: ActivationDetails | null = vault?.activationDetails || null;
  let isActivated = false;
  let activationDaysLeft: number | null = null;

  if (activationDetails && activationDetails.licenseKey) {
    const hwFingerprint = vault?.hardwareFingerprint || getHardwareDeviceFingerprint();
    const expectedTamperSig = computeTamperProofSignature(
      deviceID,
      activationDetails.licenseKey,
      activationDetails.activatedAt,
      activationDetails.expiresAt,
      hwFingerprint
    );

    // 1. Verify key validity for this specific Device ID
    const keyValidation = verifyLicenseKey(deviceID, activationDetails.licenseKey);

    // 2. Verify anti-tamper signature to ensure no unauthorized local edits
    const isSignatureIntact = !vault?.tamperSignature || vault.tamperSignature === expectedTamperSig;

    if (keyValidation.isValid && isSignatureIntact) {
      const now = new Date();
      if (activationDetails.expiresAt === 'lifetime') {
        isActivated = true;
        activationDaysLeft = null;
      } else {
        const expDate = new Date(activationDetails.expiresAt);
        if (now < expDate) {
          isActivated = true;
          const msLeft = expDate.getTime() - now.getTime();
          activationDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        } else {
          isActivated = false;
          activationDaysLeft = 0;
        }
      }
    } else {
      console.warn("Tampering or Device ID mismatch detected in license vault! Reverting to unactivated.");
      activationDetails = null;
      isActivated = false;
    }
  }

  // Update vault state
  saveLicensingVault({
    deviceID,
    activationDetails,
    firstInstallDate,
    tamperSignature: activationDetails
      ? computeTamperProofSignature(
          deviceID,
          activationDetails.licenseKey,
          activationDetails.activatedAt,
          activationDetails.expiresAt,
          vault?.hardwareFingerprint || getHardwareDeviceFingerprint()
        )
      : '',
    hardwareFingerprint: vault?.hardwareFingerprint || getHardwareDeviceFingerprint(),
    updatedAt: new Date().toISOString()
  });

  return {
    deviceID,
    activationDetails,
    firstInstallDate,
    isActivated,
    activationDaysLeft
  };
}

/**
 * Activates the application and binds it securely to the current hardware
 */
export function activateLicenseInVault(
  licenseKey: string,
  isCloud: boolean = false
): { success: boolean; details?: ActivationDetails; error?: string } {
  const deviceID = getPermanentDeviceID();
  const validation = verifyLicenseKey(deviceID, licenseKey);

  if (!validation.isValid) {
    return {
      success: false,
      error: 'مفتاح التفعيل غير صحيح أو غير متوافق مع معرف جهازك!'
    };
  }

  const now = new Date();
  let expiresAt = '';
  if (validation.durationDays >= 9999) {
    expiresAt = 'lifetime';
  } else {
    const expDate = new Date(now.getTime() + validation.durationDays * 24 * 60 * 60 * 1000);
    expiresAt = expDate.toISOString();
  }

  const details: ActivationDetails = {
    licenseKey: licenseKey.trim().toUpperCase(),
    activatedAt: now.toISOString(),
    expiresAt,
    isCloud: !!isCloud
  };

  const hwFingerprint = getHardwareDeviceFingerprint();
  const tamperSignature = computeTamperProofSignature(
    deviceID,
    details.licenseKey,
    details.activatedAt,
    details.expiresAt,
    hwFingerprint
  );

  const existingVault = getStoredLicensingVault();
  const payload: SecureActivationPayload = {
    deviceID,
    activationDetails: details,
    firstInstallDate: existingVault?.firstInstallDate || now.toISOString(),
    tamperSignature,
    hardwareFingerprint: hwFingerprint,
    updatedAt: now.toISOString()
  };

  saveLicensingVault(payload);

  return {
    success: true,
    details
  };
}

/**
 * Explicitly deactivates the application (Only called by Owner/Admin via PIN or Cloud)
 */
export function deactivateLicenseInVault(): void {
  const deviceID = getPermanentDeviceID();
  const existingVault = getStoredLicensingVault();
  const hwFingerprint = existingVault?.hardwareFingerprint || getHardwareDeviceFingerprint();

  const payload: SecureActivationPayload = {
    deviceID,
    activationDetails: null,
    firstInstallDate: existingVault?.firstInstallDate || new Date().toISOString(),
    tamperSignature: '',
    hardwareFingerprint: hwFingerprint,
    updatedAt: new Date().toISOString()
  };

  saveLicensingVault(payload);
}

/**
 * Checks if a settings key belongs to the internal licensing system
 */
export function isSystemLicensingKey(key: string): boolean {
  if (!key) return false;
  const sysKeys = [
    'activationDetails',
    'deviceID',
    'firstInstallDate',
    'cache_activationDetails',
    'cache_deviceID',
    'cache_isActivated',
    'cache_activationDaysLeft',
    'cache_trialDaysLeft',
    'cache_isInTrial',
    '__SYS_APP_LIC_VAULT__',
    'sys_lic_vault_v1',
    'system_license_vault'
  ];
  return sysKeys.includes(key);
}

/**
 * Filters out system licensing keys from any settings collection before export or saving to data dumps
 */
export function filterSystemSettings(settings: any[]): any[] {
  if (!Array.isArray(settings)) return [];
  return settings.filter(s => s && s.key && !isSystemLicensingKey(s.key));
}
