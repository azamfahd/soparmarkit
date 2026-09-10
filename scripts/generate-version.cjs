/**
 * Script: generate-version.cjs
 * Generates and updates public/version.json and syncs versionCode in android/app/build.gradle
 * Designed for automatic GitHub Actions cloud builds and local builds.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const packageJsonPath = path.join(rootDir, 'package.json');

// Read package.json
let appVersion = '1.0.4';
try {
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (pkg.version && pkg.version !== '0.0.0') {
      appVersion = pkg.version;
    }
  }
} catch (err) {
  console.warn('Could not read package.json version:', err.message);
}

// Calculate versionCode from GITHUB_RUN_NUMBER or existing file
const githubRunNumber = process.env.GITHUB_RUN_NUMBER ? parseInt(process.env.GITHUB_RUN_NUMBER, 10) : null;
let currentVersionCode = 4;

if (fs.existsSync(versionJsonPath)) {
  try {
    const currentData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    if (currentData.versionCode) {
      currentVersionCode = currentData.versionCode;
    }
  } catch (e) {}
}

const finalVersionCode = githubRunNumber ? Math.max(githubRunNumber, currentVersionCode + 1) : (currentVersionCode || 4);

// Determine update URL (prefer VITE_APK_DOWNLOAD_URL -> GitHub repo URL -> fallback)
const githubRepo = process.env.GITHUB_REPOSITORY || 'azamfahd/smart-accounting-system';
const apkDownloadUrl = process.env.VITE_APK_DOWNLOAD_URL || 
  `https://github.com/${githubRepo}/releases/download/latest/app-release.apk`;

const todayIso = new Date().toISOString().split('T')[0];

const versionMetadata = {
  version: appVersion,
  versionCode: finalVersionCode,
  buildNumber: finalVersionCode,
  releaseDate: todayIso,
  appName: 'النظام المحاسبي الذكي',
  updateUrl: apkDownloadUrl,
  minSupportedVersion: '1.0.0',
  releaseNotes: process.env.RELEASE_NOTES || 'تحديث تلقائي جديد للنظام المحاسبي: تحسينات الأداء، دعم التحديثات المزدوجة، والاحتفاظ الكامل بالبيانات.',
  features: [
    'بناء سحابي أوتوماتيكي ومجاني لحزم الـ APK عبر GitHub Actions',
    'نظام تحديث داخلي مزدوج (OTA للواجهات + تحديث مباشر لحزمة APK)',
    'تثبيت مباشر فوق النسخة القديمة بدون مسح البيانات أو الفواتير',
    'رابط تحميل مباشر ومستقر من GitHub Releases'
  ]
};

// Ensure public directory exists
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write public/version.json
fs.writeFileSync(versionJsonPath, JSON.stringify(versionMetadata, null, 2), 'utf8');
console.log(`[Version Generator] Successfully generated ${versionJsonPath}`);
console.log(`- Version: ${versionMetadata.version}`);
console.log(`- VersionCode: ${versionMetadata.versionCode}`);
console.log(`- Update URL: ${versionMetadata.updateUrl}`);

// Sync with android/app/build.gradle if it exists
if (fs.existsSync(buildGradlePath)) {
  try {
    let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Replace versionCode
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${finalVersionCode}`);
    
    // Replace versionName
    gradleContent = gradleContent.replace(/versionName\s+["'][^"']+["']/, `versionName "${appVersion}"`);
    
    fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
    console.log(`[Version Generator] Synced android/app/build.gradle with versionCode ${finalVersionCode} and versionName "${appVersion}"`);
  } catch (err) {
    console.warn(`[Version Generator] Could not update build.gradle: ${err.message}`);
  }
}
