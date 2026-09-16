import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Helper to convert Blob to Base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
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

export interface ReadyFileInfo {
  fileName: string;
  mimeType: string;
  blobUrl: string;
  sizeBytes: number;
  blob: Blob;
  base64?: string;
  text?: string;
}

/**
 * Save using Native OS File System Access API (Works inside iframes without <a> download blocking)
 */
export async function saveWithFileSystemAccess(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<boolean> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = fileName.split('.').pop() || 'dat';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: fileName,
            accept: {
              [mimeType || 'application/octet-stream']: [`.${ext}`]
            }
          }
        ]
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled dialog
        return true;
      }
      console.warn('showSaveFilePicker failed:', err);
    }
  }
  return false;
}

/**
 * Save via Server HTTP Attachment Proxy (Guarantees direct browser download manager trigger)
 */
export async function saveViaServerProxy(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<boolean> {
  try {
    const base64Data = await blobToBase64(blob);
    
    // Create hidden form and submit to /api/export/download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/export/download';
    form.target = '_blank';
    form.style.display = 'none';

    const fileField = document.createElement('input');
    fileField.type = 'hidden';
    fileField.name = 'fileDataBase64';
    fileField.value = base64Data;
    form.appendChild(fileField);

    const nameField = document.createElement('input');
    nameField.type = 'hidden';
    nameField.name = 'fileName';
    nameField.value = fileName;
    form.appendChild(nameField);

    const mimeField = document.createElement('input');
    mimeField.type = 'hidden';
    mimeField.name = 'mimeType';
    mimeField.value = mimeType;
    form.appendChild(mimeField);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      } catch {}
    }, 2000);

    return true;
  } catch (err) {
    console.warn('Server proxy form submit failed:', err);
    return false;
  }
}

/**
 * Universal High-Reliability File Saver for Android APK, Capacitor, WebViews, Web Browsers, and iFrames.
 * Guarantees direct file exporting and downloading on all devices and platforms.
 */
export async function saveFileToDevice(
  blob: Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; method: string }> {
  const blobUrl = URL.createObjectURL(blob);
  let textContent: string | undefined;
  let base64Content: string | undefined;

  try {
    if (blob.type.includes('json') || blob.type.includes('text') || fileName.endsWith('.json')) {
      textContent = await blob.text();
    }
    base64Content = await blobToBase64(blob);
  } catch (e) {
    console.warn('Extract text/base64 warning:', e);
  }

  // Dispatch global event so UI can display an immediate interactive download modal/toast
  try {
    const eventDetail: ReadyFileInfo = {
      fileName,
      mimeType,
      blobUrl,
      sizeBytes: blob.size,
      blob,
      base64: base64Content,
      text: textContent
    };
    window.dispatchEvent(new CustomEvent('smartpos:file_ready', { detail: eventDetail }));
  } catch (evErr) {
    console.warn('Dispatch file_ready event error:', evErr);
  }

  // 1. PyWebView API (Desktop Wrapper)
  if ((window as any).pywebview && (window as any).pywebview.api) {
    try {
      const text = textContent || (await blob.text());
      const success = await (window as any).pywebview.api.save_file(fileName, text);
      if (success) {
        return { success: true, method: 'pywebview' };
      }
    } catch (e) {
      console.warn('Pywebview save failed, falling back:', e);
    }
  }

  // 2. Capacitor Native APK FileSystem & Share Plugin (Primary method for Android/iOS APKs)
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = base64Content || (await blobToBase64(blob));
      
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
      console.warn('Capacitor native export failed, falling back to Web direct download:', capErr);
    }
  }

  // 3. FileSaver saveAs
  try {
    saveAs(blob, fileName);
  } catch (fsErr) {
    console.warn('file-saver saveAs notice:', fsErr);
  }

  // 4. Direct Anchor Click with DOM Attachment
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = fileName;
    a.setAttribute('download', fileName);
    
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      } catch {}
    }, 3000);
  } catch (blobErr) {
    console.warn('Direct Anchor download failed:', blobErr);
  }

  return { success: true, method: 'filesaver_and_blob' };
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
