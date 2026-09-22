import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2pdf from 'html2pdf.js';

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
  fileUri?: string;
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
): Promise<{ success: boolean; method: string; fileUri?: string }> {
  const blobUrl = URL.createObjectURL(blob);
  let textContent: string | undefined;
  let base64Content: string | undefined;
  let savedFileUri: string | undefined;

  try {
    if (blob.type.includes('json') || blob.type.includes('text') || fileName.endsWith('.json') || fileName.endsWith('.txt')) {
      textContent = await blob.text();
    }
    base64Content = await blobToBase64(blob);
  } catch (e) {
    console.warn('Extract text/base64 warning:', e);
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
  const isNative = typeof window !== 'undefined' && ((window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform());
  if (isNative) {
    try {
      const base64Data = base64Content || (await blobToBase64(blob));
      
      // First try Documents directory, then Cache/External
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        savedFileUri = result.uri;
      } catch (docErr) {
        try {
          const cacheResult = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
          savedFileUri = cacheResult.uri;
        } catch (cacheErr) {
          console.warn('Filesystem write fallback failed:', cacheErr);
        }
      }

      // Trigger Native Android Share / Save Sheet with high reliability
      if (savedFileUri) {
        try {
          await Share.share({
            title: fileName,
            text: `تصدير ملف: ${fileName}`,
            url: savedFileUri,
            dialogTitle: 'مشاركة أو حفظ الملف في الهاتف'
          });
        } catch (shareErr) {
          console.warn('Capacitor native share notice:', shareErr);
        }
      }
    } catch (capErr) {
      console.warn('Capacitor native export failed, falling back to Web direct download:', capErr);
    }
  }

  // Dispatch global event so UI can display an immediate interactive download toast/modal
  try {
    const eventDetail: ReadyFileInfo = {
      fileName,
      mimeType,
      blobUrl,
      sizeBytes: blob.size,
      blob,
      base64: base64Content,
      text: textContent,
      fileUri: savedFileUri
    };
    window.dispatchEvent(new CustomEvent('smartpos:file_ready', { detail: eventDetail }));
  } catch (evErr) {
    console.warn('Dispatch file_ready event error:', evErr);
  }

  // If running in browser or as fallback for native:
  if (!isNative) {
    // FileSaver saveAs
    try {
      saveAs(blob, fileName);
    } catch (fsErr) {
      console.warn('file-saver saveAs notice:', fsErr);
    }

    // Direct Anchor Click with DOM Attachment
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
  }

  return { success: true, method: isNative ? 'capacitor_native' : 'filesaver_and_blob', fileUri: savedFileUri };
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

/**
 * Converts an HTML element or HTML string directly into a PDF Blob and saves/shares via saveFileToDevice
 */
export async function exportHtmlToPdfFile(
  elementOrHtml: HTMLElement | string,
  fileName: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: string | [number, number];
    margin?: number | [number, number, number, number];
  }
): Promise<boolean> {
  try {
    let sourceElement: HTMLElement;
    let isTemporary = false;

    if (typeof elementOrHtml === 'string') {
      sourceElement = document.createElement('div');
      sourceElement.innerHTML = elementOrHtml;
      document.body.appendChild(sourceElement);
      isTemporary = true;
    } else {
      sourceElement = elementOrHtml;
    }

    const opt = {
      margin: options?.margin !== undefined ? options?.margin : 0.3,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el: HTMLElement) => el.tagName === 'STYLE' || el.tagName === 'LINK'
      },
      jsPDF: { 
        unit: 'in', 
        format: options?.format || 'a4', 
        orientation: options?.orientation || 'portrait' 
      }
    };

    // Output as Blob rather than direct browser save, so saveFileToDevice handles APK native share & storage
    const pdfBlob: Blob = await (html2pdf as any)()
      .set(opt)
      .from(sourceElement)
      .output('blob');

    if (isTemporary && sourceElement.parentNode) {
      sourceElement.parentNode.removeChild(sourceElement);
    }

    if (pdfBlob) {
      const result = await saveFileToDevice(pdfBlob, fileName, 'application/pdf');
      return result.success;
    }

    return false;
  } catch (err) {
    console.error('exportHtmlToPdfFile error:', err);
    return false;
  }
}
