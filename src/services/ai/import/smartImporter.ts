import { processAndStoreDocument, ProcessedDocumentResult } from '../rag/documentProcessor';
import { normalizeArabic } from '../nlu/arabicNormalizer';

export interface SmartImportOptions {
  fileName: string;
  fileType: string;
  rawContent: string;
  customCategory?: string;
  userTags?: string[];
}

export interface SmartImportResult {
  fileName: string;
  detectedCategory: string;
  processedDoc: ProcessedDocumentResult;
  recordCount?: number;
  parsedStructuredData?: any[];
}

/**
 * Automatically detects document category based on Arabic keywords and content patterns.
 */
export function autoDetectCategory(fileName: string, content: string): string {
  const combinedText = normalizeArabic(`${fileName} ${content}`).toLowerCase();

  if (combinedText.includes('سياسة') || combinedText.includes('شروط') || combinedText.includes('ضمان') || combinedText.includes('استرجاع')) {
    return 'سياسات ونظم';
  }
  if (combinedText.includes('دليل') || combinedText.includes('طريقة') || combinedText.includes('خطوات') || combinedText.includes('شرح')) {
    return 'دليل استخدام';
  }
  if (combinedText.includes('فاتورة') || combinedText.includes('مبيعات') || combinedText.includes('شراء') || combinedText.includes('إيراد')) {
    return 'سجلات مالية وفواتير';
  }
  if (combinedText.includes('زبون') || combinedText.includes('عميل') || combinedText.includes('مورد') || combinedText.includes('دين') || combinedText.includes('ديون')) {
    return 'ديون وحسابات';
  }
  if (combinedText.includes('منتج') || combinedText.includes('مخزون') || combinedText.includes('بضاعة') || combinedText.includes('صنف')) {
    return 'منتجات ومخزون';
  }

  return 'عام / مستندات معتمدة';
}

/**
 * Parses and processes incoming documents (Text, CSV, JSON, Markdown) and integrates them with RAG.
 */
export async function smartImportFile(options: SmartImportOptions): Promise<SmartImportResult> {
  const { fileName, fileType, rawContent, customCategory, userTags } = options;

  let parsedStructuredData: any[] | undefined = undefined;
  let textToProcess = rawContent;

  // Handle JSON format
  if (fileType.includes('json') || fileName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        parsedStructuredData = parsed;
        textToProcess = parsed.map((item, idx) => `عنصر ${idx + 1}: ${JSON.stringify(item)}`).join('\n\n');
      } else {
        parsedStructuredData = [parsed];
        textToProcess = JSON.stringify(parsed, null, 2);
      }
    } catch {
      // Fallback to text
      textToProcess = rawContent;
    }
  }

  // Handle CSV format
  if (fileType.includes('csv') || fileName.endsWith('.csv')) {
    const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      parsedStructuredData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });
      textToProcess = `جدول بيانات (Headers: ${headers.join(' | ')}):\n` +
        parsedStructuredData.map(r => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' - ')).join('\n');
    }
  }

  const category = customCategory || autoDetectCategory(fileName, textToProcess);
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');

  const processedDoc = await processAndStoreDocument(cleanTitle, category, textToProcess, userTags);

  return {
    fileName,
    detectedCategory: category,
    processedDoc,
    recordCount: parsedStructuredData ? parsedStructuredData.length : processedDoc.chunks.length,
    parsedStructuredData,
  };
}
