import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  FolderDown,
  HardDrive
} from 'lucide-react';
import { 
  ReadyFileInfo, 
  saveWithFileSystemAccess, 
  saveViaServerProxy 
} from '../utils/fileSaver';

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const DownloadToast: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<ReadyFileInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleFileReady = (event: Event) => {
      const customEvent = event as CustomEvent<ReadyFileInfo>;
      if (customEvent.detail) {
        setFileInfo(customEvent.detail);
        setIsVisible(true);
        setCopied(false);
        setStatusMessage(null);
      }
    };

    window.addEventListener('smartpos:file_ready', handleFileReady);
    return () => {
      window.removeEventListener('smartpos:file_ready', handleFileReady);
    };
  }, []);

  if (!isVisible || !fileInfo) {
    return null;
  }

  const isExcel = fileInfo.fileName.endsWith('.xlsx') || fileInfo.fileName.endsWith('.xls');
  const isJson = fileInfo.fileName.endsWith('.json');
  const isTextAvailable = !!fileInfo.text;

  // 1. Guaranteed Direct Download (Server attachment & Blob fallback)
  const handleDirectDownload = async () => {
    if (!fileInfo) return;
    setIsDownloading(true);
    setStatusMessage('جاري بدء التحميل المباشر...');

    try {
      // First try OS Native File System Access (Save As Picker)
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        const saved = await saveWithFileSystemAccess(fileInfo.blob, fileInfo.fileName, fileInfo.mimeType);
        if (saved) {
          setStatusMessage('تم حفظ الملف بنجاح على جهازك ✅');
          setTimeout(() => setIsVisible(false), 2500);
          return;
        }
      }

      // Second try Server HTTP Content-Disposition Proxy
      const serverProxied = await saveViaServerProxy(fileInfo.blob, fileInfo.fileName, fileInfo.mimeType);
      if (serverProxied) {
        setStatusMessage('تم إرسال أمر التنزيل للمتصفح 📥');
      }

      // Third fallback: trigger click on anchor
      const a = document.createElement('a');
      a.href = fileInfo.blobUrl;
      a.download = fileInfo.fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 2000);
    } catch (err: any) {
      console.warn('Direct download click error:', err);
      setStatusMessage('جرب خيار "فتح في نافذة مستقلة" أو "نسخ المحتوى"');
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Native Save As Picker
  const handleSaveAs = async () => {
    if (!fileInfo) return;
    try {
      const saved = await saveWithFileSystemAccess(fileInfo.blob, fileInfo.fileName, fileInfo.mimeType);
      if (saved) {
        setStatusMessage('تم الحفظ بنجاح ✅');
        setTimeout(() => setIsVisible(false), 2000);
      }
    } catch (e) {
      console.warn('Save As error:', e);
    }
  };

  // 3. Open in new tab
  const handleOpenInNewTab = () => {
    if (!fileInfo) return;
    window.open(fileInfo.blobUrl, '_blank');
  };

  // 4. Copy to clipboard
  const handleCopyContent = async () => {
    if (!fileInfo?.text) return;
    try {
      await navigator.clipboard.writeText(fileInfo.text);
      setCopied(true);
      setStatusMessage('تم نسخ محتوى الملف بالكامل للحافظة 📋');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  // 5. Native Share API
  const handleShare = async () => {
    if (!fileInfo) return;
    try {
      const file = new File([fileInfo.blob], fileInfo.fileName, { type: fileInfo.mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileInfo.fileName,
          text: `تصدير ملف: ${fileInfo.fileName}`
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
      }
    }
  };

  const hasSavePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

  return (
    <div 
      dir="rtl"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-99999 w-[95%] max-w-lg animate-bounce-subtle"
    >
      <div className="bg-slate-900/98 text-white backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-emerald-500/50 ring-4 ring-emerald-500/15 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              {isExcel ? (
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              ) : isJson ? (
                <FileCode className="w-6 h-6 text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400">ملف التصدير جاهز للحفظ</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                  {formatBytes(fileInfo.sizeBytes)}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100 truncate mt-1" title={fileInfo.fileName}>
                {fileInfo.fileName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert if any */}
        {statusMessage && (
          <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Primary Direct Download Button */}
            <button
              type="button"
              onClick={handleDirectDownload}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'جاري الحفظ...' : 'تنزيل وحفظ الملف ⬇️'}</span>
            </button>

            {/* Native OS Save As Picker if available */}
            {hasSavePicker ? (
              <button
                type="button"
                onClick={handleSaveAs}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>حفظ باسم على القرص 💾</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>فتح في نافذة مستقلة 🌐</span>
              </button>
            )}
          </div>

          {/* Secondary Actions (Copy & Share) */}
          <div className="flex items-center gap-2">
            {isTextAvailable && (
              <button
                type="button"
                onClick={handleCopyContent}
                className="flex-1 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'تم النسخ للحافظة ✅' : 'نسخ النص للحافظة 📋'}</span>
              </button>
            )}

            {typeof navigator !== 'undefined' && !!navigator.share && (
              <button
                type="button"
                onClick={handleShare}
                className="py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95 shrink-0 cursor-pointer"
                title="مشاركة أو حفظ عبر التطبيقات"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>مشاركة 📲</span>
              </button>
            )}

            <a
              href={fileInfo.blobUrl}
              download={fileInfo.fileName}
              className="py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95 shrink-0"
              title="رابط مباشر"
            >
              <FolderDown className="w-3.5 h-3.5 text-slate-400" />
              <span>رابط مباشر</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
