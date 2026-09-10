/**
 * updateService.ts
 * In-App Dual Update System:
 * 1. OTA (Over-The-Air) for lightweight web & PWA UI/feature updates without APK re-download
 * 2. Full APK Direct Update for native Android Capacitor app without losing local data
 */

export interface VersionInfo {
  version: string;
  versionCode: number;
  buildNumber?: number;
  releaseDate?: string;
  appName?: string;
  updateUrl: string;
  minSupportedVersion?: string;
  releaseNotes?: string;
  features?: string[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  updateType: 'OTA' | 'APK_FULL' | 'NONE';
  currentVersion: string;
  currentVersionCode?: number;
  latestVersion: string;
  latestVersionCode: number;
  updateUrl: string;
  releaseNotes: string;
  features: string[];
  isNativeApp: boolean;
}

const LOCAL_STORAGE_VERSION_KEY = 'app_installed_version_code';

export const UPDATE_SAFETY_NOTICE = 
  'ملاحظة أمان وموثوقية: يتم تثبيت التحديث مباشرة فوق النسخة الحالية، وكافة فواتيرك وبياناتك المخزنة محلياً في جهازك محفوظة بنسبة 100% دون مسح.';

/**
 * Gets the direct APK download URL, checking:
 * 1. import.meta.env.VITE_APK_DOWNLOAD_URL
 * 2. version.json updateUrl
 * 3. Default fallback
 */
export function getApkDownloadUrl(fallbackUrl?: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APK_DOWNLOAD_URL) {
    return import.meta.env.VITE_APK_DOWNLOAD_URL;
  }
  return fallbackUrl || 'https://github.com/azamfahd/soparmarkit/releases/download/latest/app-release.apk';
}

/**
 * Fetch latest version metadata from public/version.json
 */
export async function fetchRemoteVersionInfo(): Promise<VersionInfo | null> {
  try {
    // Add cache-busting timestamp to avoid stale HTTP caching
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (!res.ok) {
      console.warn('[UpdateService] Failed to fetch version.json, status:', res.status);
      return null;
    }
    const data: VersionInfo = await res.json();
    if (data.updateUrl && typeof import.meta !== 'undefined' && import.meta.env?.VITE_APK_DOWNLOAD_URL) {
      data.updateUrl = import.meta.env.VITE_APK_DOWNLOAD_URL;
    }
    return data;
  } catch (err) {
    console.warn('[UpdateService] Error fetching remote version info:', err);
    return null;
  }
}

/**
 * Checks for updates across both Native Android (APK) and Web/PWA (OTA)
 */
export async function checkAppUpdates(): Promise<UpdateCheckResult> {
  const remoteInfo = await fetchRemoteVersionInfo();
  
  let isNative = false;
  let currentVersion = '1.0.4';
  let currentCode = 4;

  if (typeof window !== 'undefined') {
    // Detect Capacitor Android Native Platform
    if ((window as any).Capacitor?.isNativePlatform()) {
      isNative = true;
      try {
        const { App: CapApp } = await import('@capacitor/app');
        const info = await CapApp.getInfo();
        currentVersion = info.version || '1.0.4';
        currentCode = parseInt(info.build || '4', 10);
      } catch (e) {
        console.warn('[UpdateService] Capacitor getInfo error:', e);
      }
    } else {
      // Web / PWA mode
      const savedCode = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
      if (savedCode) {
        currentCode = parseInt(savedCode, 10) || 4;
      }
    }
  }

  if (!remoteInfo) {
    return {
      hasUpdate: false,
      updateType: 'NONE',
      currentVersion,
      currentVersionCode: currentCode,
      latestVersion: currentVersion,
      latestVersionCode: currentCode,
      updateUrl: getApkDownloadUrl(),
      releaseNotes: '',
      features: [],
      isNativeApp: isNative,
    };
  }

  const latestCode = remoteInfo.versionCode || 4;
  const hasNewerVersion = latestCode > currentCode || (
    remoteInfo.version !== currentVersion && 
    compareSemver(remoteInfo.version, currentVersion) > 0
  );

  const updateType = hasNewerVersion 
    ? (isNative ? 'APK_FULL' : 'OTA')
    : 'NONE';

  return {
    hasUpdate: hasNewerVersion,
    updateType,
    currentVersion,
    currentVersionCode: currentCode,
    latestVersion: remoteInfo.version,
    latestVersionCode: latestCode,
    updateUrl: getApkDownloadUrl(remoteInfo.updateUrl),
    releaseNotes: remoteInfo.releaseNotes || 'تحديث جديد يتضمن تحسينات في الاستقرار والأداء والوظائف المحلية.',
    features: remoteInfo.features || [],
    isNativeApp: isNative,
  };
}

/**
 * Applies immediate OTA update for Web/PWA by updating Service Worker registrations
 * and reloading without erasing Dexie or IndexedDB.
 */
export async function applyOTAUpdate(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await reg.update().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[UpdateService] SW update error:', err);
  }

  // Update local version tracker
  try {
    const remote = await fetchRemoteVersionInfo();
    if (remote?.versionCode) {
      localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(remote.versionCode));
    }
  } catch {}

  // Safe reload
  window.location.reload();
}

/**
 * Triggers direct APK download from GitHub Releases
 */
export function downloadDirectAPK(targetUrl?: string): void {
  const url = targetUrl || getApkDownloadUrl();
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = 'app-release.apk';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Basic semantic version comparison helper
 */
function compareSemver(v1: string, v2: string): number {
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
