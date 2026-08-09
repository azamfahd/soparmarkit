import { cleanDocumentText } from '../rag/documentProcessor';

export interface ParsedFileContent {
  title: string;
  category: string;
  content: string;
  tags: string[];
  fileType: 'TXT' | 'CSV' | 'JSON' | 'PDF' | 'DOCX' | 'MANUAL';
  fileName: string;
  fileSize: number;
}

/**
 * Parses plain text or Markdown file content.
 */
export function parseTextOrMarkdownFile(
  fileName: string,
  rawText: string,
  fileSize: number
): ParsedFileContent {
  const cleaned = cleanDocumentText(rawText);
  const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Detect category from content/filename keywords
  let category = 'إرشادات عامة';
  if (/(سياسة|إرجاع|استبدال|ضمان)/i.test(cleaned) || /(سياسة|سياسات)/i.test(fileName)) {
    category = 'سياسات وقوانين';
  } else if (/(دليل|شرح|طريقة|خطوات|كيفية)/i.test(cleaned) || /(دليل|استخدام)/i.test(fileName)) {
    category = 'دليل استخدام';
  } else if (/(محاسبة|فاتورة|ديون|صندوق|جرد|ضرائب)/i.test(cleaned)) {
    category = 'أنظمة محاسبية';
  }

  return {
    title,
    category,
    content: cleaned,
    tags: extractFileTags(cleaned, fileName),
    fileType: 'TXT',
    fileName,
    fileSize,
  };
}

/**
 * Parses CSV table file content into readable structured textual representation.
 */
export function parseCSVFile(
  fileName: string,
  csvText: string,
  fileSize: number
): ParsedFileContent {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  if (lines.length === 0) {
    return {
      title,
      category: 'بيانات جدولية',
      content: 'ملف CSV فارغ',
      tags: ['جدول', 'CSV'],
      fileType: 'CSV',
      fileName,
      fileSize,
    };
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    return headers.map((h, i) => `${h}: ${cells[i] || '-'}`).join(' | ');
  });

  const formattedContent = `جدول بيانات [${title}]\nالأعمدة: ${headers.join(', ')}\n\n` +
    rows.slice(0, 100).join('\n');

  return {
    title,
    category: 'بيانات جدولية',
    content: formattedContent,
    tags: ['جدول', 'CSV', ...headers.slice(0, 5)],
    fileType: 'CSV',
    fileName,
    fileSize,
  };
}

/**
 * Parses JSON structured file content.
 */
export function parseJSONFile(
  fileName: string,
  jsonText: string,
  fileSize: number
): ParsedFileContent {
  const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  let content = '';
  let tags: string[] = ['JSON', 'بيانات'];

  try {
    const parsed = JSON.parse(jsonText);

    if (Array.isArray(parsed)) {
      content = `قائمة بيانات JSON تحتوي على ${parsed.length} عنصر:\n` +
        parsed
          .slice(0, 50)
          .map((item, idx) => `عنصر #${idx + 1}: ${JSON.stringify(item, null, 2)}`)
          .join('\n\n');
    } else if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.title) title;
      content = Object.entries(parsed)
        .map(([k, v]) => `• ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
      tags.push(...Object.keys(parsed).slice(0, 5));
    } else {
      content = String(parsed);
    }
  } catch {
    content = jsonText;
  }

  return {
    title,
    category: 'مستندات هيكلية',
    content: cleanDocumentText(content),
    tags,
    fileType: 'JSON',
    fileName,
    fileSize,
  };
}

/**
 * Reads a File object in the browser and parses it according to its mime-type/extension.
 */
export async function readAndParseUploadedFile(file: File): Promise<ParsedFileContent> {
  const fileName = file.name;
  const fileSize = file.size;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const rawText = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error(`فشل قراءة الملف ${fileName}`));
    reader.readAsText(file);
  });

  if (extension === 'csv') {
    return parseCSVFile(fileName, rawText, fileSize);
  } else if (extension === 'json') {
    return parseJSONFile(fileName, rawText, fileSize);
  } else if (extension === 'pdf' || extension === 'docx') {
    // For browser plain text conversion fallback
    return {
      title: fileName.replace(/\.[^/.]+$/, ''),
      category: 'مستندات PDF/Word',
      content: cleanDocumentText(rawText),
      tags: [extension.toUpperCase(), 'مستند'],
      fileType: extension === 'pdf' ? 'PDF' : 'DOCX',
      fileName,
      fileSize,
    };
  } else {
    return parseTextOrMarkdownFile(fileName, rawText, fileSize);
  }
}

function extractFileTags(content: string, fileName: string): string[] {
  const tags = new Set<string>();
  const lower = (content + ' ' + fileName).toLowerCase();

  if (lower.includes('سياسة')) tags.add('سياسة');
  if (lower.includes('إرجاع')) tags.add('إرجاع');
  if (lower.includes('دين')) tags.add('ديون');
  if (lower.includes('مخزون')) tags.add('مخزون');
  if (lower.includes('صندوق')) tags.add('صندوق');
  if (lower.includes('جرد')) tags.add('جرد');
  if (lower.includes('مورد')) tags.add('موردين');
  if (lower.includes('فاتورة')) tags.add('فواتير');

  return Array.from(tags);
}
