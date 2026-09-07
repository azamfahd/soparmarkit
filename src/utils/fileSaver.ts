import * as XLSX from 'xlsx';

/**
 * Universal File Saver for Mobile (APK / Android WebView) and Web.
 * 100% Offline Capable.
 * Uses Web Share API (native Android share sheet to save directly to Files/Downloads/Drive)
 * with automatic fallback to Data URLs and Blob Object URLs.
 */
export async function saveFileToDevice(
  blob: Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; method: string }> {
  // 1. Check if PyWebView API exists (Desktop App Wrapper)
  if ((window as any).pywebview && (window as any).pywebview.api) {
    try {
      const text = await blob.text();
      const success = await (window as any).pywebview.api.save_file(fileName, text);
      return { success: !!success, method: 'pywebview' };
    } catch (e) {
      console.warn('Pywebview save failed, falling back:', e);
    }
  }

  // 2. Prepare a File object for Web Share API (Supported in Android APK / WebView / Mobile Browsers)
  const file = new File([blob], fileName, { type: mimeType });

  // Try Web Share API (Android WebShare opens system share sheet: "Save to Files / Downloads", WhatsApp, Drive, etc.)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: `تصدير ملف: ${fileName}`
      });
      return { success: true, method: 'share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User explicitly dismissed the share sheet - treat as completed
        return { success: true, method: 'share_dismissed' };
      }
      console.warn('Web Share failed, falling back to direct download:', err);
    }
  }

  // 3. Data URL Fallback (Works in Android WebViews that ignore blob: URLs)
  try {
    const reader = new FileReader();
    const dataUrlPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dataUrl = await dataUrlPromise;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 1000);

    return { success: true, method: 'data_url' };
  } catch (err) {
    console.warn('Data URL download failed, trying Blob URL:', err);
  }

  // 4. Standard Blob URL Fallback
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

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
    // Fallback to XLSX.writeFile
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
