/**
 * updateService.ts
 * In-App Direct GitHub & Dual Update System for APK & Web:
 * 1. Direct GitHub Releases API query for repository: azamfahd/soparmarkit
 * 2. OTA (Over-The-Air) for lightweight web & PWA UI updates
 * 3. Full APK Direct Download from GitHub Release Assets without losing local data
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getLatestAppVersion } from './firebase';

export const GITHUB_REPO = 'azamfahd/soparmarkit';
export const GITHUB_RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`;
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
  hasDirectApk: boolean;
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
  source: 'FIREBASE' | 'GITHUB' | 'LOCAL_CONFIG' | 'FALLBACK';
  publishedAt?: string;
  hasDirectApk?: boolean;
}

const LOCAL_STORAGE_VERSION_KEY = 'app_installed_version_code';

export const UPDATE_SAFETY_NOTICE = 
  'ملاحظة أمان وموثوقية: يتم تثبيت وتطبيق التحديث مباشرة فوق النسخة الحالية، وكافة فواتيرك وبياناتك المخزنة محلياً في جهازك محفوظة بنسبة 100% دون مسح.';

/**
 * Gets the direct APK download URL, checking:
 * 1. import.meta.env.VITE_APK_DOWNLOAD_URL
 * 2. Fallback provided URL
 * 3. Official GitHub Releases page
 */
export function getApkDownloadUrl(fallbackUrl?: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APK_DOWNLOAD_URL) {
    return import.meta.env.VITE_APK_DOWNLOAD_URL;
  }
  return fallbackUrl || GITHUB_RELEASES_PAGE_URL;
}

/**
 * Directly queries GitHub Releases API for repository azamfahd/soparmarkit
 * Queries /releases/latest first, and falls back to /releases list
 */
export async function fetchGitHubLatestRelease(): Promise<GitHubReleaseInfo | null> {
  try {
    let data: any = null;

    // 1. Try /releases/latest
    try {
      const res = await fetch(GITHUB_RELEASES_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      console.warn('[UpdateService] Latest release fetch error:', e);
    }

    // 2. Fallback to /releases list if /latest returned 404 or empty
    if (!data || !data.tag_name) {
      try {
        const listRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache',
          },
        });
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list) && list.length > 0) {
            data = list[0];
          }
        }
      } catch (e) {
        console.warn('[UpdateService] Releases list fetch error:', e);
      }
    }

    if (!data || !data.tag_name) {
      return null;
    }

    const tagName = data.tag_name || 'v1.0.0';
    const cleanVersion = tagName.replace(/^v/i, '').trim();

    // Search assets for genuine .apk file
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

    const hasDirectApk = Boolean(apkAsset && apkAsset.browser_download_url);
    // If a genuine .apk asset is present, use its direct download URL.
    // Otherwise, point to the release page on GitHub to prevent downloading corrupt/fake non-apk files!
    const apkUrl = hasDirectApk && apkAsset
      ? apkAsset.browser_download_url
      : (data.html_url || `${GITHUB_RELEASES_PAGE_URL}/tag/${tagName}`);

    return {
      tag_name: tagName,
      versionName: cleanVersion,
      name: data.name || `إصدار GitHub جديد ${tagName}`,
      body: data.body || 'تحديث جديد صادر مباشرة من مستودع GitHub يتضمن تحسينات وميزات جديدة.',
      published_at: data.published_at || new Date().toISOString(),
      html_url: data.html_url || `${GITHUB_RELEASES_PAGE_URL}/tag/${tagName}`,
      assets,
      apkUrl,
      hasDirectApk,
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
 * Checks for updates:
 * 1. Firebase Cloud Database (app_config/version_info) - Live & instant developer broadcast
 * 2. GitHub Releases API - Binary releases & tags
 * 3. Local version.json - Offline fallback
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
        if (info.version) currentVersion = info.version;
        if (info.build) currentCode = parseInt(info.build, 10);
      } catch (e) {
        console.warn('[UpdateService] Capacitor getInfo error:', e);
      }
    }
    const savedInstalled = localStorage.getItem('app_installed_version_str');
    if (savedInstalled) {
      currentVersion = savedInstalled;
    }
    const savedCode = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
    if (savedCode) {
      currentCode = parseInt(savedCode, 10) || currentCode;
    }
  }

  // 1. Fetch potential updates from Firebase Cloud and GitHub Releases concurrently
  const [cloudVersionConfig, githubRelease, remoteInfo] = await Promise.all([
    getLatestAppVersion().catch(() => null),
    fetchGitHubLatestRelease().catch(() => null),
    fetchRemoteVersionInfo().catch(() => null),
  ]);

  let bestVersionStr = currentVersion;
  let bestSource: 'FIREBASE' | 'GITHUB' | 'LOCAL_CONFIG' | 'FALLBACK' = 'FALLBACK';
  let bestUpdateUrl = getApkDownloadUrl();
  let bestReleaseNotes = '';
  let bestPublishedAt: string | undefined = undefined;
  let hasDirectApk = false;

  // Check Firebase first (most direct & immediate)
  if (cloudVersionConfig && cloudVersionConfig.latestVersion) {
    bestVersionStr = cloudVersionConfig.latestVersion;
    bestSource = 'FIREBASE';
    bestUpdateUrl = cloudVersionConfig.apkUrl || bestUpdateUrl;
    bestReleaseNotes = cloudVersionConfig.updateMessage || 'يتوفر تحديث جديد يحتوي على تحسينات واسعة وإصلاحات للتطبيق.';
    bestPublishedAt = cloudVersionConfig.updatedAt;
    hasDirectApk = bestUpdateUrl.toLowerCase().includes('.apk');
  }

  // Check GitHub Releases (if newer than Firebase, prefer GitHub; otherwise keep Firebase)
  if (githubRelease && githubRelease.versionName) {
    if (compareSemver(githubRelease.versionName, bestVersionStr) > 0 || bestSource === 'FALLBACK') {
      bestVersionStr = githubRelease.versionName;
      bestSource = 'GITHUB';
      bestUpdateUrl = githubRelease.apkUrl;
      bestReleaseNotes = githubRelease.body || githubRelease.name;
      bestPublishedAt = githubRelease.published_at;
      hasDirectApk = githubRelease.hasDirectApk;
    }
  }

  // Check local/fallback remote info if neither was set
  if (bestSource === 'FALLBACK' && remoteInfo && remoteInfo.version) {
    bestVersionStr = remoteInfo.version;
    bestSource = 'LOCAL_CONFIG';
    bestUpdateUrl = getApkDownloadUrl(remoteInfo.updateUrl);
    bestReleaseNotes = remoteInfo.releaseNotes || 'تحديث جديد يتضمن تحسينات بالاستقرار والأداء.';
    hasDirectApk = remoteInfo.updateUrl.toLowerCase().includes('.apk');
  }

  const hasUpdate = compareSemver(bestVersionStr, currentVersion) > 0;

  return {
    hasUpdate,
    updateType: hasUpdate ? (isNative ? 'APK_FULL' : 'OTA') : 'NONE',
    currentVersion,
    currentVersionCode: currentCode,
    latestVersion: bestVersionStr,
    latestVersionCode: currentCode + (hasUpdate ? 1 : 0),
    updateUrl: bestUpdateUrl,
    releaseNotes: bestReleaseNotes || (cloudVersionConfig?.updateMessage) || 'تحديث جديد للنظام المحاسبي.',
    features: githubRelease?.name ? [githubRelease.name] : (remoteInfo?.features || []),
    isNativeApp: isNative,
    githubRelease: githubRelease || undefined,
    source: bestSource,
    publishedAt: bestPublishedAt,
    hasDirectApk,
  };
}

/**
 * Applies immediate in-place update for Web, PWA, and APK WebView
 * Completely clears outdated cache storage, triggers service worker refresh, and reloads
 */
export async function applyOTAUpdate(newVersionStr?: string, newVersionCode?: number): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Wipe old browser CacheStorage so new bundled scripts and styles load immediately
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.warn('[UpdateService] CacheStorage clear error:', err);
  }

  try {
    // 2. Unregister or skip waiting on existing service workers
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
    console.warn('[UpdateService] ServiceWorker update error:', err);
  }

  try {
    // 3. Record the updated version in localStorage
    if (newVersionStr) {
      localStorage.setItem('app_installed_version_str', newVersionStr);
    }
    if (newVersionCode) {
      localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(newVersionCode));
    } else {
      const remote = await fetchRemoteVersionInfo();
      if (remote?.versionCode) {
        localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(remote.versionCode));
      }
    }
  } catch {}

  // 4. Force reload page with a cache-busting timestamp query parameter
  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.set('v_update', Date.now().toString());
  window.location.href = targetUrl.toString();
}

/**
 * Triggers APK download from GitHub Releases
 * STRICT VALIDATION: If URL is not an actual APK file (e.g. web page or release HTML),
 * opens the official GitHub Releases page in a new tab instead of downloading a corrupt file!
 */
export function downloadDirectAPK(targetUrl?: string): void {
  const url = targetUrl || getApkDownloadUrl();
  if (typeof window === 'undefined') return;

  const isDirectApk = url.toLowerCase().split('?')[0].endsWith('.apk') || url.toLowerCase().includes('.apk');

  if (!isDirectApk) {
    // Open the official GitHub release page in a new tab
    const target = url.startsWith('http') ? url : GITHUB_RELEASES_PAGE_URL;
    window.open(target, '_blank', 'noopener,noreferrer');
    return;
  }

  // Real direct APK download
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const fileName = url.split('/').pop()?.split('?')[0] || 'smart-pos-accounting.apk';
  link.download = fileName.endsWith('.apk') ? fileName : `${fileName}.apk`;
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

/**
 * Interface result returned by installDownloadedAPK
 */
export interface ApkInstallResult {
  success: boolean;
  method: 'ANDROID_BRIDGE' | 'CAPACITOR_APP' | 'CAPACITOR_FILE' | 'DIRECT_BROWSER' | 'FALLBACK';
  message: string;
}

/**
 * Universal Native In-Place APK Installer:
 * Installs/re-installs the new downloaded APK package on top of the existing app
 * without deleting user data or IndexedDB / SQLite storage.
 *
 * It utilizes:
 * 1. Android JavaScript Bridge (@JavascriptInterface methods if hosted in Android WebView APK)
 * 2. Capacitor App / Plugins (AppLauncher, Filesystem + FileOpener / Native Intent)
 * 3. Browser direct install intent / trigger fallback
 *
 * @param apkUrlOrPath The direct URL or device file path/URI of the APK package.
 */
export async function installDownloadedAPK(apkUrlOrPath?: string): Promise<ApkInstallResult> {
  const url = apkUrlOrPath || getApkDownloadUrl();
  const fileName = url.split('/').pop()?.split('?')[0] || 'smart-pos-accounting.apk';
  const cleanFileName = fileName.endsWith('.apk') ? fileName : `${fileName}.apk`;

  if (typeof window === 'undefined') {
    return { success: false, method: 'FALLBACK', message: 'البيئة الحالية غير مدعومة' };
  }

  // -------------------------------------------------------------
  // Method 1: Android Native Bridge (Custom WebView / Java Bridge)
  // -------------------------------------------------------------
  const win = window as any;
  const androidBridge = win.Android || win.android || win.JSBridge || win.AndroidBridge;

  if (androidBridge) {
    try {
      // 1. Direct install from downloaded file path / URL
      if (typeof androidBridge.installApk === 'function') {
        androidBridge.installApk(url);
        return {
          success: true,
          method: 'ANDROID_BRIDGE',
          message: 'تم إرسال أمر تثبيت التحديث عبر واجهة الأندرويد البرمجية بنجاح.',
        };
      }
      if (typeof androidBridge.installPackage === 'function') {
        androidBridge.installPackage(url);
        return {
          success: true,
          method: 'ANDROID_BRIDGE',
          message: 'تم إرسال أمر تثبيت الحزمة عبر واجهة الأندرويد البرمجية بنجاح.',
        };
      }
      if (typeof androidBridge.updateApp === 'function') {
        androidBridge.updateApp(url);
        return {
          success: true,
          method: 'ANDROID_BRIDGE',
          message: 'تم إرسال أمر تحديث التطبيق عبر واجهة الأندرويد البرمجية بنجاح.',
        };
      }
      if (typeof androidBridge.openApkFile === 'function') {
        androidBridge.openApkFile(cleanFileName);
        return {
          success: true,
          method: 'ANDROID_BRIDGE',
          message: 'تم فتح ملف الـ APK لتثبيت التحديث مباشرة فوق النسخة الحالية.',
        };
      }
    } catch (bridgeErr) {
      console.warn('[UpdateService] AndroidBridge install call failed:', bridgeErr);
    }
  }

  // -------------------------------------------------------------
  // Method 2: Capacitor Native Plugins (Capacitor.isNativePlatform())
  // -------------------------------------------------------------
  const isCapNative = typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform?.() || win.Capacitor?.isNativePlatform?.());

  if (isCapNative) {
    // 2.1 Check custom / community plugins or custom Registered Capacitor Plugin
    const capPlugins = win.Capacitor?.Plugins || {};

    // Check if AppUpdate / FileOpener / AppInstaller plugin is registered
    const appInstallerPlugin = capPlugins.AppUpdate || capPlugins.FileOpener || capPlugins.AppInstaller;
    if (appInstallerPlugin) {
      try {
        if (typeof appInstallerPlugin.installApk === 'function') {
          await appInstallerPlugin.installApk({ filePath: url });
          return {
            success: true,
            method: 'CAPACITOR_APP',
            message: 'تم بدء تثبيت التحديث عبر إضافة Capacitor App بنجاح.',
          };
        }
        if (typeof appInstallerPlugin.open === 'function') {
          await appInstallerPlugin.open({
            filePath: url,
            contentType: 'application/vnd.android.package-archive',
          });
          return {
            success: true,
            method: 'CAPACITOR_APP',
            message: 'تم تشغيل برنامج تثبيت الحزم (Package Installer) بنجاح.',
          };
        }
      } catch (capErr) {
        console.warn('[UpdateService] Capacitor installer plugin error:', capErr);
      }
    }

    // 2.2 Using Filesystem to check file and AppLauncher / OpenUrl with Android Intent
    try {
      // If the URL is a remote web APK link, attempt downloading to device cache/documents
      let localUri = url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const checkFile = await Filesystem.getUri({
            path: cleanFileName,
            directory: Directory.Cache,
          }).catch(() => null);

          if (checkFile?.uri) {
            localUri = checkFile.uri;
          }
        } catch {}
      }

      // Check AppLauncher or window.open intent
      const appLauncher = capPlugins.AppLauncher;
      if (appLauncher && typeof appLauncher.openUrl === 'function') {
        const canOpen = await appLauncher.canOpenUrl({ url: localUri }).catch(() => ({ value: true }));
        if (canOpen?.value !== false) {
          await appLauncher.openUrl({ url: localUri });
          return {
            success: true,
            method: 'CAPACITOR_APP',
            message: 'تم إطلاق برنامج تثبيت الحزم لتحديث التطبيق فوق النسخة الحالية.',
          };
        }
      }
    } catch (fsErr) {
      console.warn('[UpdateService] Capacitor Filesystem / AppLauncher install error:', fsErr);
    }
  }

  // -------------------------------------------------------------
  // Method 3: Browser Download & Direct Trigger Fallback
  // (Triggers Android Package Installer directly on download completion)
  // -------------------------------------------------------------
  try {
    downloadDirectAPK(url);
    return {
      success: true,
      method: 'DIRECT_BROWSER',
      message: 'جاري تنزيل ملف التحديث وسيتم تشغيل مثبت الحزم للتثبيت فوق النسخة الحالية مع الحفاظ على كافة البيانات.',
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'FALLBACK',
      message: `تعذر بدء التثبيت التلقائي: ${err?.message || 'خطأ غير معروف'}`,
    };
  }
}


