/**
 * updateService.ts
 * In-App Direct GitHub & Dual Update System for APK & Web:
 * 1. Direct GitHub Releases API query for repository: azamfahd/soparmarkit
 * 2. OTA (Over-The-Air) for lightweight web & PWA UI updates
 * 3. Full APK Direct Download from GitHub Release Assets without losing local data
 */

export const GITHUB_REPO = 'azamfahd/soparmarkit';
export const GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
  created_at: string;
}

export interface GitHubReleaseInfo {
  tag_name: string;
  versionName: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
  apkUrl: string;
}

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
  githubRelease?: GitHubReleaseInfo;
  source: 'GITHUB' | 'LOCAL_CONFIG' | 'FALLBACK';
  publishedAt?: string;
}

const LOCAL_STORAGE_VERSION_KEY = 'app_installed_version_code';

export const UPDATE_SAFETY_NOTICE = 
  'ملاحظة أمان وموثوقية: يتم تثبيت التحديث مباشرة فوق النسخة الحالية، وكافة فواتيرك وبياناتك المخزنة محلياً في جهازك محفوظة بنسبة 100% دون مسح.';

/**
 * Gets the direct APK download URL, checking:
 * 1. import.meta.env.VITE_APK_DOWNLOAD_URL
 * 2. GitHub Release Asset URL
 * 3. Default fallback
 */
export function getApkDownloadUrl(fallbackUrl?: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APK_DOWNLOAD_URL) {
    return import.meta.env.VITE_APK_DOWNLOAD_URL;
  }
  return fallbackUrl || `https://github.com/${GITHUB_REPO}/releases/download/latest/app-release.apk`;
}

/**
 * Directly queries GitHub Releases API for repository azamfahd/soparmarkit
 */
export async function fetchGitHubLatestRelease(): Promise<GitHubReleaseInfo | null> {
  try {
    const res = await fetch(GITHUB_RELEASES_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      console.warn('[UpdateService] GitHub Releases API error status:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.tag_name) {
      return null;
    }

    const tagName = data.tag_name || 'v1.0.0';
    const cleanVersion = tagName.replace(/^v/i, '').trim();

    // Search assets for .apk file
    const assets: GitHubReleaseAsset[] = Array.isArray(data.assets)
      ? data.assets.map((a: any) => ({
          name: a.name || '',
          browser_download_url: a.browser_download_url || '',
          size: a.size || 0,
          download_count: a.download_count || 0,
          created_at: a.created_at || '',
        }))
      : [];

    const apkAsset = assets.find(
      (a) => a.name.toLowerCase().endsWith('.apk') || a.browser_download_url.toLowerCase().endsWith('.apk')
    );

    const apkUrl = apkAsset
      ? apkAsset.browser_download_url
      : `https://github.com/${GITHUB_REPO}/releases/download/${tagName}/app-release.apk`;

    return {
      tag_name: tagName,
      versionName: cleanVersion,
      name: data.name || `إصدار GitHub جديد ${tagName}`,
      body: data.body || 'تحديث جديد صادر مباشرة من مستودع GitHub يتضمن تحسينات وميزات جديدة.',
      published_at: data.published_at || new Date().toISOString(),
      html_url: data.html_url || `https://github.com/${GITHUB_REPO}/releases/tag/${tagName}`,
      assets,
      apkUrl,
    };
  } catch (err) {
    console.warn('[UpdateService] Failed to query GitHub Releases API directly:', err);
    return null;
  }
}

/**
 * Fetch latest version metadata from public/version.json
 */
export async function fetchRemoteVersionInfo(): Promise<VersionInfo | null> {
  try {
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
 * Checks for updates directly via GitHub Releases API first, with local fallback
 */
export async function checkAppUpdates(): Promise<UpdateCheckResult> {
  let isNative = false;
  let currentVersion = '1.0.4';
  let currentCode = 4;

  if (typeof window !== 'undefined') {
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
      const savedCode = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
      if (savedCode) {
        currentCode = parseInt(savedCode, 10) || 4;
      }
    }
  }

  // 1. Primary Check: GitHub Releases API directly
  const githubRelease = await fetchGitHubLatestRelease();
  if (githubRelease) {
    const latestVersionStr = githubRelease.versionName;
    const isNewer = compareSemver(latestVersionStr, currentVersion) > 0;

    return {
      hasUpdate: isNewer,
      updateType: isNewer ? (isNative ? 'APK_FULL' : 'OTA') : 'NONE',
      currentVersion,
      currentVersionCode: currentCode,
      latestVersion: latestVersionStr,
      latestVersionCode: currentCode + (isNewer ? 1 : 0),
      updateUrl: githubRelease.apkUrl,
      releaseNotes: githubRelease.body || githubRelease.name,
      features: [githubRelease.name],
      isNativeApp: isNative,
      githubRelease,
      source: 'GITHUB',
      publishedAt: githubRelease.published_at,
    };
  }

  // 2. Secondary Fallback: public/version.json
  const remoteInfo = await fetchRemoteVersionInfo();
  if (remoteInfo) {
    const latestCode = remoteInfo.versionCode || 4;
    const hasNewerVersion = latestCode > currentCode || (
      remoteInfo.version !== currentVersion && 
      compareSemver(remoteInfo.version, currentVersion) > 0
    );

    return {
      hasUpdate: hasNewerVersion,
      updateType: hasNewerVersion ? (isNative ? 'APK_FULL' : 'OTA') : 'NONE',
      currentVersion,
      currentVersionCode: currentCode,
      latestVersion: remoteInfo.version,
      latestVersionCode: latestCode,
      updateUrl: getApkDownloadUrl(remoteInfo.updateUrl),
      releaseNotes: remoteInfo.releaseNotes || 'تحديث جديد يتضمن تحسينات في الاستقرار والأداء والوظائف المحلية.',
      features: remoteInfo.features || [],
      isNativeApp: isNative,
      source: 'LOCAL_CONFIG',
    };
  }

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
    source: 'FALLBACK',
  };
}

/**
 * Applies immediate OTA update for Web/PWA
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

  try {
    const remote = await fetchRemoteVersionInfo();
    if (remote?.versionCode) {
      localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(remote.versionCode));
    }
  } catch {}

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
 * Semantic version comparison helper
 */

export function compareSemver(v1: string, v2: string): number {
  const p1 = (v1 || '0').replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = (v2 || '0').replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

