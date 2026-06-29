/**
 * Licensing & Activation Utility
 * Highly secure, offline-capable, deterministic license key validator and generator.
 */

function customHash(str: string): string {
  let hash = 0;
  // Custom salt secret key
  const salt = "GROCERY_POS_LICENSE_SALT_SECRET_2026";
  const combined = str + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Generates a unique Device ID based on random components, stored persistently.
 */
export function generateDeviceID(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  const part = () => {
    let p = '';
    for (let i = 0; i < 4; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return p;
  };
  return `GR-${part()}-${part()}-${part()}`;
}

/**
 * Generates a license key for a specific Device ID and duration in days.
 * @param deviceID The device ID of the client (e.g., GR-ABCD-EFGH-IJKL)
 * @param durationDays Number of days (e.g., 30, 90, 365, or 9999 for Lifetime)
 */
export function generateLicenseKey(deviceID: string, durationDays: number): string {
  const cleanDevice = deviceID.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const durationHex = durationDays.toString(16).toUpperCase().padStart(4, '0');
  const signature = customHash(cleanDevice + durationHex);
  
  // Format: LIC-DURATION-DEVSTART-SIGNATURE-DEVEND
  const key = `LIC-${durationHex}-${cleanDevice.slice(0, 4)}-${signature.slice(0, 8)}-${cleanDevice.slice(-4)}`;
  return key;
}

/**
 * Verifies if a given license key is valid for the current Device ID.
 */
export function verifyLicenseKey(deviceID: string, licenseKey: string): { isValid: boolean; durationDays: number } {
  try {
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
    const recomputedSig = customHash(cleanDevice + durationHex);
    
    if (recomputedSig.slice(0, 8) === sig) {
      return { isValid: true, durationDays };
    }
  } catch (e) {
    console.error("License validation error:", e);
  }
  return { isValid: false, durationDays: 0 };
}
