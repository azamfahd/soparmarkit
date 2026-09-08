import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Helper to convert Blob to Base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal High-Reliability File Saver for Android APK, Capacitor, WebViews, and Web Browsers.
 * Guarantees file exporting/downloading on Android devices without permission blocks.
 */
export async function saveFileToDevice(
  blob: Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; method: string }> {
  // 1. PyWebView API (Desktop Wrapper)
  if ((window as any).pywebview && (window as any).pywebview.api) {
    try {
      const text = await blob.text();
      const success = await (window as any).pywebview.api.save_file(fileName, text);
      return { success: !!success, method: 'pywebview' };
    } catch (e) {
      console.warn('Pywebview save failed, falling back:', e);
    }
  }

  // 2. Capacitor Native APK FileSystem & Share Plugin (Primary method for Android APK)
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      
      // Write file directly to Documents or Cache
      let fileUri: string = '';
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        fileUri = result.uri;
      } catch (docErr) {
        // Fallback to Cache directory
        const cacheResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        });
        fileUri = cacheResult.uri;
      }

      // Trigger Native Android Share / Save Sheet
      if (fileUri) {
        try {
          await Share.share({
            title: fileName,
            text: `تصدير ملف: ${fileName}`,
            url: fileUri,
            dialogTitle: 'حفظ وتصدير الملف إلى الهاتف'
          });
        } catch (shareErr) {
          console.warn('Capacitor native share notice:', shareErr);
        }
      }

      return { success: true, method: 'capacitor_native' };
    } catch (capErr) {
      console.warn('Capacitor native export failed, falling back to WebShare / DataURL:', capErr);
    }
  }

  // 3. Web Share API (Android WebViews / Mobile Chrome / TWAs)
  const file = new File([blob], fileName, { type: mimeType });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: `تصدير ملف: ${fileName}`
      });
      return { success: true, method: 'web_share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: true, method: 'share_dismissed' };
      }
      console.warn('Web Share failed, attempting direct Data URL fallback:', err);
    }
  }

  // 4. Data URL Direct Download (Works in WebViews & browsers)
  try {
    const dataUrl = `data:${mimeType};base64,${await blobToBase64(blob)}`;
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 1500);

    return { success: true, method: 'data_url' };
  } catch (err) {
    console.warn('Data URL download failed, trying Blob URL:', err);
  }

  // 5. Standard Blob URL Fallback
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);

    return { success: true, method: 'blob_url' };
  } catch (err) {
    console.error('All file download methods failed:', err);
    return { success: false, method: 'none' };
  }
}

/**
 * Download XLSX WorkBook directly to user device in APK or Web
 */
export async function downloadWorkbook(wb: XLSX.WorkBook, fileName: string): Promise<boolean> {
  try {
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const res = await saveFileToDevice(blob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.success;
  } catch (err) {
    console.error('Error in downloadWorkbook:', err);
    try {
      XLSX.writeFile(wb, fileName);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Save HTML5 Canvas as image file
 */
export async function saveCanvasImageToDevice(canvas: HTMLCanvasElement, fileName: string): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const res = await saveFileToDevice(blob, fileName, 'image/png');
      resolve(res.success);
    }, 'image/png', 1.0);
  });
}
