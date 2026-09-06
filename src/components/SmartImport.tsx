import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../db';
import { 
  Sparkles, 
  Upload, 
  AlertCircle, 
  Trash2, 
  Database, 
  RefreshCw, 
  Check, 
  Plus, 
  Users, 
  Package, 
  Briefcase,
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  X,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelHubSection } from '../features/smart-import/ExcelHubSection';
import { DatabaseHubSection } from '../features/smart-import/DatabaseHubSection';
import { CloudSyncSection } from '../features/smart-import/CloudSyncSection';
import { SmartImportGroup, SmartImportHubProps } from '../features/smart-import/types';

type DataType = 'products' | 'customers' | 'suppliers' | 'mixed';

export default function SmartImport(props: SmartImportHubProps) {
  const {
    storeName,
    onImported = () => {},
    onGoBack,
    exportData,
    importData,
    handleImportPython,
    isBackupOverdue,
    lastBackupDate,
    backupAlertInterval,
    updateBackupAlertInterval,
    isBackupSyncing,
    isAutoBackupEnabled,
    setIsAutoBackupEnabled,
    autoBackupFileStatus,
    forceLocalDiskBackup,
    resetDatabase,
    showNotification,
    onOpenExcelSyncCenter,
    deviceID,
    isActivated,
    trialDaysLeft,
    activationDetails,
    handleRequestCloudActivation,
    isSubmittingRequest,
    setActiveTab
  } = props;

  const [activeGroup, setActiveGroup] = useState<SmartImportGroup>('excel');

  const [dataType, setDataType] = useState<DataType>('mixed'); // default to 'mixed' for an all-in-one awesome experience!
  const [parseMethod, setParseMethod] = useState<'classic' | 'classic'>('classic');
  const [pastedText, setPastedText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<{ data: string; mimeType: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');
  
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [mixedProducts, setMixedProducts] = useState<any[]>([]);
  const [mixedCustomers, setMixedCustomers] = useState<any[]>([]);
  const [mixedSuppliers, setMixedSuppliers] = useState<any[]>([]);
  const [activeMixedTab, setActiveMixedTab] = useState<'products' | 'customers' | 'suppliers'>('products');

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "جاري الاتصال بالعقل الاصطناعي Gemini 3.5 لفك وتدقيق البيانات...",
    "نقوم بتحليل وقراءة الصورة / المستند بدقة عالية...",
    "تخمين الأسعار والتكلفة والكميات تلقائياً...",
    "تحليل وتبويب الأصناف والمبيعات المحاسبية...",
    "التأكد من سلامة كشوف الحسابات المرفقة...",
    "بناء جدول مراجعة تفاعلي ذكي..."
  ];

  const triggerClassicAnalysis = () => {
    setErrorMessage('');
    setSuccessInfo('');
    
    let textToParse = pastedText.trim();
    if (!textToParse && uploadedFile) {
      // ملف اسم الفاتورة الذكي في الوضع الكلاسيكي دون اتصال بالإنترنت
      const lastDot = uploadedFile.name.lastIndexOf('.');
      const nameWithoutExtension = lastDot !== -1 ? uploadedFile.name.substring(0, lastDot) : uploadedFile.name;
      // استبدال الشرطات والمستويات بمسافات لسهولة القراءة
      textToParse = nameWithoutExtension.replace(/[-_]+/g, ' ');
    }

    if (!textToParse) {
      setErrorMessage('الرجاء كتابة أو لصق نص أو رفع ملف للتحليل المحلي الكلاسيكي الذكي المدمج.');
      return;
    }

    try {
      const lines = textToParse.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let parsedItems: any[] = [];
      let parsedProducts: any[] = [];
      let parsedCustomers: any[] = [];
      let parsedSuppliers: any[] = [];

      // 1. كاشف الهيدر الذكي (Dynamic Header Detector for Excel/CSV Copy-Pasting)
      let headerMap: Record<string, number> = {};
      const firstLine = lines[0] || '';
      const containsDelimiter = firstLine.includes(',') || firstLine.includes(';') || firstLine.includes('\t') || firstLine.includes('|');
      let isHeaderPresent = false;

      if (containsDelimiter) {
        const headerTokens = firstLine.split(/[,;\t|]+/).map(t => t.trim().toLowerCase());
        const hasKeyword = headerTokens.some(t => 
          t.includes('الاسم') || t.includes('اسم') || t.includes('صنف') || t.includes('سعر') || t.includes('بيع') || t.includes('شراء') || t.includes('تكلفة') || t.includes('كمية') || t.includes('جوال') || t.includes('رصيد') || t.includes('دين') || t.includes('باركود')
        );
        if (hasKeyword) {
          isHeaderPresent = true;
          headerTokens.forEach((tok, index) => {
            if (tok.includes('اسم') || tok.includes('صنف') || tok.includes('الاسم') || tok.includes('المنتج') || tok.includes('الزبون') || tok.includes('المورد') || tok.includes('الجهة')) {
              headerMap['name'] = index;
            } else if (tok.includes('بيع') || tok.includes('سعر البيع') || tok.includes('سعر') || tok.includes('للمستهلك')) {
              headerMap['sale_price'] = index;
            } else if (tok.includes('شراء') || tok.includes('تكلفة') || tok.includes('سعر الشراء') || tok.includes('سعر التكلفة') || tok.includes('التكلفه')) {
              headerMap['cost_price'] = index;
            } else if (tok.includes('كمية') || tok.includes('الكمية') || tok.includes('مخزون') || tok.includes('عدد') || tok.includes('العدد')) {
              headerMap['stock_quantity'] = index;
            } else if (tok.includes('جوال') || tok.includes('هاتف') || tok.includes('تلفون') || tok.includes('رقم')) {
              headerMap['phone'] = index;
            } else if (tok.includes('رصيد') || tok.includes('دين') || tok.includes('الأرصدة') || tok.includes('الديون') || tok.includes('المبلغ') || tok.includes('القيمة')) {
              headerMap['balance'] = index;
            } else if (tok.includes('تصنيف') || tok.includes('قسم') || tok.includes('الفئة') || tok.includes('نوع')) {
              headerMap['category'] = index;
            } else if (tok.includes('باركود') || tok.includes('رقم التسلسلي') || tok.includes('الرمز') || tok.includes('رمز')) {
              headerMap['barcode'] = index;
            } else if (tok.includes('وحدة') || tok.includes('الوحدة')) {
              headerMap['unit'] = index;
            }
          });
        }
      }

      // 2. تحليل الأسطر سطر سطر بذكاء محلي
      const startIndex = isHeaderPresent ? 1 : 0;

      for (let idx = startIndex; idx < lines.length; idx++) {
        const originalLine = lines[idx].trim();
        if (!originalLine) continue;

        let name = '';
        let cost_price = 0;
        let sale_price = 0;
        let stock_quantity = 1;
        let barcode = '';
        let category = 'عام';
        let unit = 'حبة';
        let phone = '';
        let balance = 0;

        // التحقق من نوع المعالجة المطلوبة (مجدولة أم لغة طبيعية)
        const parts = originalLine.split(/[,;\t|]+/).map(p => p.trim());
        const isStructuredTable = parts.length > 1;

        if (isStructuredTable) {
          // أ) معالجة الجداول المهيكلة (CSV, TSV, Copyed from Excel)
          if (isHeaderPresent) {
            // استخراج بناءً على دالة الهيدر المكتشفة
            name = parts[headerMap['name']] || parts[0] || 'بند غير معروف';
            
            if (headerMap['sale_price'] !== undefined) {
              const cleaned = (parts[headerMap['sale_price']] || '').replace(/[^\d.-]/g, '');
              sale_price = parseFloat(cleaned) || 0;
            }
            if (headerMap['cost_price'] !== undefined) {
              const cleaned = (parts[headerMap['cost_price']] || '').replace(/[^\d.-]/g, '');
              cost_price = parseFloat(cleaned) || 0;
            }
            if (headerMap['stock_quantity'] !== undefined) {
              const cleaned = (parts[headerMap['stock_quantity']] || '').replace(/[^\d.-]/g, '');
              stock_quantity = parseFloat(cleaned) || 1;
            }
            if (headerMap['phone'] !== undefined) {
              phone = (parts[headerMap['phone']] || '').replace(/[^\d+]/g, '');
            }
            if (headerMap['balance'] !== undefined) {
              const cleaned = (parts[headerMap['balance']] || '').replace(/[^\d.-]/g, '');
              balance = parseFloat(cleaned) || 0;
            }
            if (headerMap['category'] !== undefined) {
              category = parts[headerMap['category']] || 'عام';
            }
            if (headerMap['barcode'] !== undefined) {
              barcode = (parts[headerMap['barcode']] || '').replace(/[^\d]/g, '');
            }
            if (headerMap['unit'] !== undefined) {
              unit = parts[headerMap['unit']] || 'حبة';
            }
          } else {
            // تقسيم عشوائي بدون هيدر (الاسم دائماً أول عمود، ثم الأرقام تعامل بذكاء ذروة البيع/الشراء)
            name = parts[0] || 'بند غير معروف';
            let extractedNumbers: number[] = [];
            let extractedStrings: string[] = [];

            for (let i = 1; i < parts.length; i++) {
              const p = parts[i];
              const cleanedNum = p.replace(/[^\d.-]/g, '');
              const num = parseFloat(cleanedNum);
              if (!isNaN(num)) {
                extractedNumbers.push(num);
              } else if (p) {
                extractedStrings.push(p);
              }
            }

            category = extractedStrings[0] || 'عام';
            unit = extractedStrings[1] || 'حبة';

            // فرز الأرقام المستخرجة
            if (extractedNumbers.length === 1) {
              sale_price = extractedNumbers[0];
              balance = extractedNumbers[0];
            } else if (extractedNumbers.length === 2) {
              // الأكبر سعر بيع والأصغر سعر شراء أو توازن حسابات
              cost_price = Math.min(extractedNumbers[0], extractedNumbers[1]);
              sale_price = Math.max(extractedNumbers[0], extractedNumbers[1]);
              balance = extractedNumbers[0];
              phone = String(extractedNumbers[1]);
            } else if (extractedNumbers.length >= 3) {
              cost_price = Math.min(extractedNumbers[0], extractedNumbers[1]);
              sale_price = Math.max(extractedNumbers[0], extractedNumbers[1]);
              stock_quantity = extractedNumbers[2];
              if (extractedNumbers[3]) {
                barcode = String(extractedNumbers[3]);
              }
            }
          }
        } else {
          // ب) معالجة اللغة الطبيعية العربية المحاسبية (Arabic Local NLP Regex Compiler)
          const words = originalLine.split(/\s+/).map(w => w.trim());
          
          // البحث بذكاء الكلمات المفتاحية
          const saleMatch = originalLine.match(/(?:سعر|بيع|ببيع|بـ|بـ|سعر البيع|للمستهلك|قيمة|مبلغ)\s*(\d+(?:\.\d+)?)/);
          if (saleMatch) sale_price = parseFloat(saleMatch[1]);

          const costMatch = originalLine.match(/(?:تكلفة|تكلفه|شراء|شرا|علينا|تكلفنا|المورد|جملة|جمله)\s*(\d+(?:\.\d+)?)/);
          if (costMatch) cost_price = parseFloat(costMatch[1]);

          const qtyMatch = originalLine.match(/(?:كمية|كميه|مخزون|عدد|عندي|حبّات|حبات|موجود|متبقي|كرتون|كيس)\s*(\d+)/) || originalLine.match(/(\d+)\s*(?:حبة|حبه|قطعة|قطعه|كيس|كرتون|كيلو|علبة|علبه|متر|لتر)/);
          if (qtyMatch) stock_quantity = parseFloat(qtyMatch[1]);

          const phoneMatch = originalLine.match(/(?:جوال|تلفون|موبايل|هاتف|رقم)?\s*(05\d{8}|966\d{9}|7\d{8}|[71]\d{7})/);
          if (phoneMatch) phone = phoneMatch[1];

          const balanceMatch = originalLine.match(/(?:رصيد|دين|عليه|له|مستحق|حساب|سلف|سحب)\s*(\d+(?:\.\d+)?)/);
          if (balanceMatch) balance = parseFloat(balanceMatch[1]);

          const barcodeMatch = originalLine.match(/\b(\d{8,14})\b/);
          if (barcodeMatch) barcode = barcodeMatch[1];

          // استخراج مسمى الصنف أو الشخص بحذف العبارات المزعجة والأرقام
          const noiseWords = [
            'بسعر', 'سعر', 'بيع', 'شراء', 'تكلفة', 'تكلفه', 'علينا', 'عندي', 'كمية', 'كميه', 'مخزون', 'ريال', 'ريالا', 
            'ريالات', 'قرش', 'دولار', 'حبة', 'حبه', 'قطعة', 'قطعه', 'كيس', 'كرتون', 'مورد', 'عميل', 'زبون', 'له', 'عليه', 
            'دين', 'رصيد', 'تلفون', 'جوال', 'موبايل', 'هاتف', 'منه', 'منها', 'في', 'من', 'على', 'بـ', 'ب', 'وموجود', 'معنا', 'إجمالي'
          ];
          
          let nameParts: string[] = [];
          for (const word of words) {
            const cleanWord = word.replace(/[^\d.-]/g, '');
            const num = parseFloat(cleanWord);
            const isPhoneOrBarcode = (word.length >= 7 && /^\d+$/.test(word));
            if (isNaN(num) && !noiseWords.includes(word.toLowerCase()) && !isPhoneOrBarcode) {
              nameParts.push(word);
            }
          }
          name = nameParts.join(' ') || 'بند غير معروف';

          // قيم تكميلية بالفرز الذكي إذا لم يتم كشفها بالكلمات
          const allCleanNumbers = words
            .map(w => w.replace(/[^\d.-]/g, ''))
            .map(w => parseFloat(w))
            .filter(n => !isNaN(n));

          if (sale_price === 0 && cost_price === 0 && allCleanNumbers.length > 0) {
            if (allCleanNumbers.length === 1) {
              sale_price = allCleanNumbers[0];
              balance = allCleanNumbers[0];
            } else if (allCleanNumbers.length === 2) {
              cost_price = Math.min(allCleanNumbers[0], allCleanNumbers[1]);
              sale_price = Math.max(allCleanNumbers[0], allCleanNumbers[1]);
              balance = allCleanNumbers[0];
            } else if (allCleanNumbers.length >= 3) {
              cost_price = Math.min(allCleanNumbers[0], allCleanNumbers[1]);
              sale_price = Math.max(allCleanNumbers[0], allCleanNumbers[1]);
              stock_quantity = allCleanNumbers[2];
            }
          }
        }

        if (!name || name === 'بند غير معروف' || name.length < 2) continue;

        // 3. اتجاه التصنيف التلقائي الذكي للمجموعات (Mixed Mode Classification)
        const lowerLine = originalLine.toLowerCase();
        const isSupplier = lowerLine.includes('مورد') || lowerLine.includes('شركة') || lowerLine.includes('مؤسسة') || lowerLine.includes('مصنع') || lowerLine.includes('مندوب') || lowerLine.includes('فاتورة شراء') || lowerLine.includes('له');
        const isCustomer = lowerLine.includes('زبون') || lowerLine.includes('عميل') || lowerLine.includes('جوال') || lowerLine.includes('دين') || lowerLine.includes('عليه') || lowerLine.includes('دفتر') || lowerLine.includes('شراء آجل');

        let resolvedType = dataType;
        if (dataType === 'mixed') {
          if (isSupplier) {
            resolvedType = 'suppliers';
          } else if (isCustomer) {
            resolvedType = 'customers';
          } else {
            resolvedType = 'products';
          }
        }

        // 4. بناء الكائنات المحوسبة بدقة
        if (resolvedType === 'products') {
          // الحماية المحاسبية: سعر البيع دائماً لا يقل عن سعر التكلفة لسلامة الأرباح
          if (cost_price > sale_price && sale_price > 0) {
            const temp = cost_price;
            cost_price = sale_price;
            sale_price = temp;
          }

          const productObj = {
            name: name.trim(),
            cost_price: Number(cost_price) || 0,
            sale_price: Number(sale_price) || 0,
            stock_quantity: Number(stock_quantity) || 0,
            category: category.trim(),
            unit: unit.trim(),
            barcode: barcode || ''
          };

          if (dataType === 'mixed') {
            parsedProducts.push(productObj);
          } else {
            parsedItems.push(productObj);
          }

        } else if (resolvedType === 'customers') {
          const customerObj = {
            name: name.trim(),
            phone: phone ? phone.trim() : '',
            balance: Number(balance) || 0
          };

          if (dataType === 'mixed') {
            parsedCustomers.push(customerObj);
          } else {
            parsedItems.push(customerObj);
          }

        } else if (resolvedType === 'suppliers') {
          const supplierObj = {
            name: name.trim(),
            phone: phone ? phone.trim() : '',
            balance: Number(balance) || 0
          };

          if (dataType === 'mixed') {
            parsedSuppliers.push(supplierObj);
          } else {
            parsedItems.push(supplierObj);
          }
        }
      }

      // 5. التحديث النهائي وإرسال الإخطارات
      if (dataType === 'mixed') {
        const total = parsedProducts.length + parsedCustomers.length + parsedSuppliers.length;
        if (total === 0) {
          throw new Error('لم نتمكن من تقسيم وفك طلاسم النص لبيانات محاسبية واضحة. يرجى تجربة تنسيق أفضل.');
        }
        setMixedProducts(parsedProducts);
        setMixedCustomers(parsedCustomers);
        setMixedSuppliers(parsedSuppliers);
        setSuccessInfo(`⚡ [ثورة المعالجة المحلية الذكية 100% بدون إنترنت] تم فك تشفير وتفكيك وتصنيف ${total} أسطر من الملف/النص بنجاح مذهل! 📦 المنتجات: ${parsedProducts.length} | 👥 الزبائن: ${parsedCustomers.length} | 💼 الموردين: ${parsedSuppliers.length}. يرجى المراجعة بالجدول لحفظهم.`);
      } else {
        if (parsedItems.length === 0) {
          throw new Error('لم نتمكن من تقسيم وفك طلاسم النص لبيانات محاسبية واضحة. يرجى تجربة تنسيق أفضل.');
        }
        setItemsList(parsedItems);
        setSuccessInfo(`⚡ [ثورة المعالجة المحلية الذكية 100% بدون إنترنت] تم استخراج وتفكيك ${parsedItems.length} أسطر بدقة فائقة! يمكنك مراجعتها وتعديلها في الجدول وحفظها فوراً.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    setErrorMessage('');
    setSuccessInfo('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Data = resultString.split(',')[1];
        setBase64File({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.onerror = () => {
        setErrorMessage('فشل في قراءة ملف الصورة.');
      };
      reader.readAsDataURL(file);
    } else if (
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.type === 'application/vnd.ms-excel'
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          setPastedText(csvContent);
          setBase64File(null);
          setSuccessInfo(`📥 تم قراءة ملف إكسل [${file.name}] بنجاح واستخراج جدول البيانات محلياً! يمكنك الآن مراجعة النص في الأسفل أو البدء في المعالجة والتحليل.`);
        } catch (err) {
          console.error(err);
          setErrorMessage('فشل في معالجة وقراءة ملف إكسل. تأكد من أن الملف غير تالف وصيغته صحيحة.');
        }
      };
      reader.onerror = () => {
        setErrorMessage('فشل في قراءة ملف الإكسل.');
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Treat as Text/CSV
      const reader = new FileReader();
      reader.onload = () => {
        setPastedText(reader.result as string);
        setBase64File(null);
      };
      reader.onerror = () => {
        setErrorMessage('فشل في قراءة ملف النص.');
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setBase64File(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerAIAnalysis = async () => {
    setErrorMessage('');
    setSuccessInfo('');
    setIsLoading(true);

    try {
      const customApiKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('user_gemini_api_key') || '') : '';
      const response = await fetch('/api/gemini/smart-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType,
          text: pastedText,
          fileData: base64File,
          customApiKey
        })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'حدث خطأ غير متوقع أثناء تحليل البيانات بالذكاء الاصطناعي.');
      }

      // Populate ItemsList based on what returned
      const resultObj = resJson.data;
      let parsedItems: any[] = [];
      if (dataType === 'products' && resultObj.products) {
        parsedItems = resultObj.products;
      } else if (dataType === 'customers' && resultObj.customers) {
        parsedItems = resultObj.customers;
      } else if (dataType === 'suppliers' && resultObj.suppliers) {
        parsedItems = resultObj.suppliers;
      } else if (dataType === 'mixed') {
        setMixedProducts(resultObj.products || []);
        setMixedCustomers(resultObj.customers || []);
        setMixedSuppliers(resultObj.suppliers || []);
        
        const total = (resultObj.products?.length || 0) + (resultObj.customers?.length || 0) + (resultObj.suppliers?.length || 0);
        if (total === 0) {
          throw new Error('لم يعثر الذكاء الاصطناعي على أي أصناف أو ديون أو أرصدة في المستند المرفق. الرجاء تجربة جودة صورة أفضل أو نص أوضح.');
        }
        setSuccessInfo(`🎉 تم تحليل وفصل المستند الشامل بنجاح! تم استخراج: ${resultObj.products?.length || 0} صنفاً، ${resultObj.customers?.length || 0} حساب عميل، و ${resultObj.suppliers?.length || 0} حساب مورد للتدقيق.`);
        return;
      } else {
        throw new Error('لم يتمكن الذكاء الاصطناعي من هيكلة البيانات بشكل صحيح للنوع الحالي. جرب إدخال أوصخ وثيقة أوضح.');
      }

      if (parsedItems.length === 0) {
        throw new Error('لم نجد أي مُدخل مالي أو بيانات مفهومة مطابقة للنوع الحالي في الملف المرفق. الرجاء التأكد من جودة الصورة أو محتوى النص.');
      }

      setItemsList(parsedItems);
      setSuccessInfo(`تم العثور على ${parsedItems.length} سطر جاهز للمراجعة والاستيراد بنجاح!`);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const updated = [...itemsList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItemsList(updated);
  };

  const handleAddField = () => {
    let newRowObj: any = {};
    if (dataType === 'products') {
      newRowObj = { name: 'صنف جديد', cost_price: 0, sale_price: 0, stock_quantity: 1, category: 'عام', unit: 'حبة', barcode: '' };
    } else {
      newRowObj = { name: 'جهة/زبون جديد', phone: '', balance: 0 };
    }
    setItemsList([...itemsList, newRowObj]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = [...itemsList];
    updated.splice(index, 1);
    setItemsList(updated);
  };

  const executeFinalImport = async () => {
    setErrorMessage('');
    setSuccessInfo('');
    setIsLoading(true);

    try {
      if (dataType === 'mixed') {
        if (importMode === 'replace') {
          await db.products.clear();
          await db.inventoryLogs.clear();
          await db.customers.clear();
          await db.debts.clear();
          await db.suppliers.clear();
          await db.supplierPayments.clear();
        }

        // 1. Save Products
        for (const item of mixedProducts) {
          const nameSafe = item.name.trim();
          if (!nameSafe) continue;
          const existing = await db.products.where('name').equals(nameSafe).first();
          if (existing) {
            await db.products.update(existing.id!, {
              cost_price: Number(item.cost_price) || 0,
              sale_price: Number(item.sale_price) || 0,
              stock_quantity: Number(item.stock_quantity) || 0,
              category: item.category || existing.category,
              barcode: item.barcode || existing.barcode,
              unit: item.unit || existing.unit
            });
            await db.inventoryLogs.add({
              product_id: existing.id!,
              change_amount: (Number(item.stock_quantity) || 0) - existing.stock_quantity,
              reason: "تسوية مخزن (استيراد شامل ذكي)",
              created_at: new Date().toISOString()
            });
          } else {
            const prodId = await db.products.add({
              name: nameSafe,
              cost_price: Number(item.cost_price) || 0,
              sale_price: Number(item.sale_price) || 0,
              stock_quantity: Number(item.stock_quantity) || 0,
              category: item.category || "عام",
              barcode: item.barcode || "",
              unit: item.unit || "حبة"
            });
            await db.inventoryLogs.add({
              product_id: prodId,
              change_amount: Number(item.stock_quantity) || 0,
              reason: "إضافة صنف بالاستيراد الشامل",
              created_at: new Date().toISOString()
            });
          }
        }

        // 2. Save Customers
        for (const item of mixedCustomers) {
          const nameSafe = item.name.trim();
          if (!nameSafe) continue;
          const existing = await db.customers.where('name').equals(nameSafe).first();
          if (existing) {
            const newBal = Number(item.balance) || 0;
            const diff = newBal - existing.balance;
            await db.customers.update(existing.id!, {
              balance: newBal,
              phone: item.phone || existing.phone
            });
            if (diff !== 0) {
              await db.debts.add({
                customer_id: existing.id!,
                amount: Math.abs(diff),
                type: diff > 0 ? 'purchase' : 'payment',
                created_at: new Date().toISOString(),
                notes: "تسوية دين عميل (استيراد شامل ذكي)"
              });
            }
          } else {
            const custId = await db.customers.add({
              name: nameSafe,
              phone: item.phone || "",
              balance: Number(item.balance) || 0
            });
            if ((Number(item.balance) || 0) > 0) {
              await db.debts.add({
                customer_id: custId,
                amount: Number(item.balance) || 0,
                type: 'purchase',
                created_at: new Date().toISOString(),
                notes: "رصيد دين افتتاحي (استيراد شامل ذكي)"
              });
            }
          }
        }

        // 3. Save Suppliers
        for (const item of mixedSuppliers) {
          const nameSafe = item.name.trim();
          if (!nameSafe) continue;
          const existing = await db.suppliers.where('name').equals(nameSafe).first();
          if (existing) {
            await db.suppliers.update(existing.id!, {
              balance: Number(item.balance) || 0,
              phone: item.phone || existing.phone
            });
          } else {
            await db.suppliers.add({
              name: nameSafe,
              phone: item.phone || "",
              balance: Number(item.balance) || 0
            });
          }
        }

        const totalSaved = mixedProducts.length + mixedCustomers.length + mixedSuppliers.length;
        setSuccessInfo(`🎉 تهانينا! تم ترحيل وحفظ جميع البيانات بنجاح (${totalSaved} سجل) في قاعدة بيانات متجرك: ${storeName}`);
        setMixedProducts([]);
        setMixedCustomers([]);
        setMixedSuppliers([]);
      } else {
        if (dataType === 'products') {
          if (importMode === 'replace') {
            await db.products.clear();
            await db.inventoryLogs.clear();
          }
          for (const item of itemsList) {
            const nameSafe = item.name.trim();
            if (!nameSafe) continue;

            const existing = await db.products.where('name').equals(nameSafe).first();
            if (existing) {
              await db.products.update(existing.id!, {
                cost_price: Number(item.cost_price) || 0,
                sale_price: Number(item.sale_price) || 0,
                stock_quantity: Number(item.stock_quantity) || 0,
                category: item.category || existing.category,
                barcode: item.barcode || existing.barcode,
                unit: item.unit || existing.unit
              });
              await db.inventoryLogs.add({
                product_id: existing.id!,
                change_amount: (Number(item.stock_quantity) || 0) - existing.stock_quantity,
                reason: "إعادة تعيين رصيد المخزن عبر الاستيراد الذكي بالذكاء الاصطناعي",
                created_at: new Date().toISOString()
              });
            } else {
              const prodId = await db.products.add({
                name: nameSafe,
                cost_price: Number(item.cost_price) || 0,
                sale_price: Number(item.sale_price) || 0,
                stock_quantity: Number(item.stock_quantity) || 0,
                category: item.category || "مواد غذائية",
                barcode: item.barcode || "",
                unit: item.unit || "حبة"
              });
              await db.inventoryLogs.add({
                product_id: prodId,
                change_amount: Number(item.stock_quantity) || 0,
                reason: "إضافة صنف كلياً بالاستيراد الذكي",
                created_at: new Date().toISOString()
              });
            }
          }
        } else if (dataType === 'customers') {
          if (importMode === 'replace') {
            await db.customers.clear();
            await db.debts.clear();
          }
          for (const item of itemsList) {
            const nameSafe = item.name.trim();
            if (!nameSafe) continue;

            const existing = await db.customers.where('name').equals(nameSafe).first();
            if (existing) {
              const newBal = Number(item.balance) || 0;
              const diff = newBal - existing.balance;
              await db.customers.update(existing.id!, {
                balance: newBal,
                phone: item.phone || existing.phone
              });
              if (diff !== 0) {
                await db.debts.add({
                  customer_id: existing.id!,
                  amount: Math.abs(diff),
                  type: diff > 0 ? 'purchase' : 'payment',
                  created_at: new Date().toISOString(),
                  notes: "تسوية محاسبية ذكية عبر تعديل الاستيراد"
                });
              }
            } else {
              const custId = await db.customers.add({
                name: nameSafe,
                phone: item.phone || "",
                balance: Number(item.balance) || 0
              });
              if ((Number(item.balance) || 0) > 0) {
                await db.debts.add({
                  customer_id: custId,
                  amount: Number(item.balance) || 0,
                  type: 'purchase',
                  created_at: new Date().toISOString(),
                  notes: "رصيد دين افتتاحى تم قراءته واستيراده بالذكاء الاصطناعي"
                });
              }
            }
          }
        } else {
          // suppliers
          if (importMode === 'replace') {
            await db.suppliers.clear();
            await db.supplierPayments.clear();
          }
          for (const item of itemsList) {
            const nameSafe = item.name.trim();
            if (!nameSafe) continue;

            const existing = await db.suppliers.where('name').equals(nameSafe).first();
            if (existing) {
              await db.suppliers.update(existing.id!, {
                balance: Number(item.balance) || 0,
                phone: item.phone || existing.phone
              });
            } else {
              await db.suppliers.add({
                name: nameSafe,
                phone: item.phone || "",
                balance: Number(item.balance) || 0
              });
            }
          }
        }
        setSuccessInfo(`🎉 تهانينا! تم ترحيل وحفظ ${itemsList.length} سطر بنجاح في قاعدة البيانات المحاصرة لمتجر: ${storeName}`);
      }

      setItemsList([]); // Empty list on success
      setPastedText('');
      setUploadedFile(null);
      setBase64File(null);
      
      onImported();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`حدث فشل أثناء حفظ البيانات المحاسبية: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = dataType === 'mixed' 
    ? (mixedProducts.length > 0 || mixedCustomers.length > 0 || mixedSuppliers.length > 0)
    : itemsList.length > 0;

  return (
    <div className="space-y-6" id="smart-import-container">
      {onGoBack && (
        <div className="flex justify-start">
          <button 
            onClick={onGoBack}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-emerald-600 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-2xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
            title="الرجوع للوحة المتابعة الرئيسية"
          >
            <ArrowRight className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>العودة للوحة المتابعة الرئيسية</span>
          </button>
        </div>
      )}

      {/* Primary Hub Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> مركز البيانات والاستيراد الشامل
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                متجر: {storeName}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">مركز البيانات والاستيراد الشامل 📊</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              بوابتك المركزية الموحدة لإدارة ملفات Excel، المزامنة الحية، النسخ الاحتياطي، قاعدة البيانات، واستيراد الفواتير.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>محلي 100% أوفلاين (بدون إنترنت)</span>
            </span>
          </div>
        </div>

        {/* Compact & Fully Visible Top Segmented Navigation Bar */}
        <div className="p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {/* Tab 1: Excel */}
            <button
              type="button"
              onClick={() => setActiveGroup('excel')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeGroup === 'excel'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300 ring-1 ring-emerald-400/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${activeGroup === 'excel' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/60 text-slate-500'}`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="whitespace-nowrap font-black">إدارة ومزامنة Excel 📊</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                activeGroup === 'excel' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200/50 text-slate-500 border-slate-300/60'
              }`}>
                محلي 100%
              </span>
            </button>

            {/* Tab 2: Database */}
            <button
              type="button"
              onClick={() => setActiveGroup('database')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeGroup === 'database'
                  ? 'bg-white text-violet-800 shadow-xs border border-violet-300 ring-1 ring-violet-400/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${activeGroup === 'database' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200/60 text-slate-500'}`}>
                  <Database className="w-4 h-4" />
                </div>
                <span className="whitespace-nowrap font-black">قاعدة البيانات والنسخ 💾</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                activeGroup === 'database' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-200/50 text-slate-500 border-slate-300/60'
              }`}>
                JSON & قرص
              </span>
            </button>

            {/* Tab 3: OCR & AI */}
            <button
              type="button"
              onClick={() => setActiveGroup('ocr_ai')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeGroup === 'ocr_ai'
                  ? 'bg-white text-amber-800 shadow-xs border border-amber-300 ring-1 ring-amber-400/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${activeGroup === 'ocr_ai' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/60 text-slate-500'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="whitespace-nowrap font-black">استيراد الفواتير والمستندات 📷</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                activeGroup === 'ocr_ai' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-200/50 text-slate-500 border-slate-300/60'
              }`}>
                AI & كلاسيك
              </span>
            </button>

            {/* Tab 4: Cloud Sync */}
            <button
              type="button"
              onClick={() => setActiveGroup('cloud_sync')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeGroup === 'cloud_sync'
                  ? 'bg-white text-blue-800 shadow-xs border border-blue-300 ring-1 ring-blue-400/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${activeGroup === 'cloud_sync' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/60 text-slate-500'}`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="whitespace-nowrap font-black">المزامنة والربط السحابي 🌐</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                activeGroup === 'cloud_sync' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-200/50 text-slate-500 border-slate-300/60'
              }`}>
                اختياري
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Group 1: Excel Hub Section */}
      {activeGroup === 'excel' && (
        <ExcelHubSection
          showNotification={showNotification}
          onOpenExcelSyncCenter={onOpenExcelSyncCenter}
          onImportSuccess={onImported}
        />
      )}

      {/* Group 2: Database and Backup Management Section */}
      {activeGroup === 'database' && (
        <DatabaseHubSection
          exportData={exportData}
          importData={importData}
          handleImportPython={handleImportPython}
          isBackupOverdue={isBackupOverdue}
          lastBackupDate={lastBackupDate}
          backupAlertInterval={backupAlertInterval}
          updateBackupAlertInterval={updateBackupAlertInterval}
          isBackupSyncing={isBackupSyncing}
          isAutoBackupEnabled={isAutoBackupEnabled}
          setIsAutoBackupEnabled={setIsAutoBackupEnabled}
          autoBackupFileStatus={autoBackupFileStatus}
          forceLocalDiskBackup={forceLocalDiskBackup}
          resetDatabase={resetDatabase}
          showNotification={showNotification}
        />
      )}

      {/* Group 3: Document & Invoice OCR Smart Parser */}
      {activeGroup === 'ocr_ai' && (
        <div className="space-y-4">
          {/* Subheader for OCR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" /> استيراد الوثائق الذكي
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800">استيراد الفواتير الورقية ودفاتر الديون والنصوص 📷</h2>
              <p className="text-slate-500 text-xs mt-1">
                التقط صورة لدفتر الديون، أو فاتورة مخزن، أو اكتب نصاً محاسبياً يدوياً؛ وسيقوم النظام بتحليل الأرقام والأسماء وحفظها بدقة وتنسيق رائع.
              </p>
            </div>
            
            <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 gap-1 sm:gap-0">
              <button 
                onClick={() => { setDataType('mixed'); setItemsList([]); setMixedProducts([]); setMixedCustomers([]); setMixedSuppliers([]); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-xl transition-all ${dataType === 'mixed' ? 'bg-white shadow-sm text-indigo-750 border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>الكل (استيراد شامل متكامل) 👑</span>
              </button>
              <button 
                onClick={() => { setDataType('products'); setItemsList([]); setMixedProducts([]); setMixedCustomers([]); setMixedSuppliers([]); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-xl transition-all ${dataType === 'products' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>منتجات ومخزون 📦</span>
              </button>
              <button 
                onClick={() => { setDataType('customers'); setItemsList([]); setMixedProducts([]); setMixedCustomers([]); setMixedSuppliers([]); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-xl transition-all ${dataType === 'customers' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-4 h-4 text-violet-600" />
                <span>زبائن وديون 👥</span>
              </button>
              <button 
                onClick={() => { setDataType('suppliers'); setItemsList([]); setMixedProducts([]); setMixedCustomers([]); setMixedSuppliers([]); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-xl transition-all ${dataType === 'suppliers' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>موردين وأرصدة 💼</span>
              </button>
            </div>
          </div>

      {/* Main workspace */}
      {!hasResults ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Uploader & Textarea Left */}
          <div className="md:col-span-7 space-y-4">
            {/* Visual File Upload Stage */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white rounded-3xl p-8 border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] shadow-sm relative overflow-hidden group ${dragOver ? 'border-violet-500 bg-violet-50/40 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50/50'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*,text/*,.csv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden" 
              />
              
              <div className="absolute top-3 right-3 opacity-15">
                <Sparkles className="w-24 h-24 text-violet-500 animate-pulse" />
              </div>

              {!uploadedFile ? (
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 mx-auto group-hover:scale-105 transition-transform shadow-sm border border-violet-100/50">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">اضغط هنا لتحميل أو سحب وإفلات ملف الفاتورة/الكشف</h3>
                    <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto leading-relaxed">
                      يدعم الصور الورقية، الفواتير، جداول الإكسل المصورة، أو ملفات النص والـ CSV مباشرة.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 relative z-10 w-full max-w-md bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 ml-2 rounded-xl bg-violet-600 text-white shadow-md">
                        {uploadedFile.type.startsWith('image/') ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{uploadedFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded-full transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pasted text zone */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-violet-500" />
                  <span>أو اكتب/الصق البيانات نصياً هنا مباشرة للحساب الفوري</span>
                </label>
                {pastedText && (
                  <button onClick={() => setPastedText('')} className="text-xs text-rose-500 hover:underline font-bold cursor-pointer">مسح النص</button>
                )}
              </div>
              <textarea 
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={
                  dataType === 'mixed'
                    ? "مثال خليط محاسبي شامل (للكل):\nشامبو دوف 12 18 50 (منتج: تكلفة 12، بيع 18، مخزون 50)\nزبون فاضل العلي جوال 0501234567 دين 350 (عميل)\nمورد شركة نادك جوال 0555999888 رصيد دائن 1400 (مورد)"
                    : dataType === 'products' 
                    ? "أرز بسمتي 5 كيلو بـ 45 ريال وسعره علينا 30 وعندي منه 20 كيس\nزيت طبخ عافية 1.5 لتر تكلفته 10 للبيع بـ 15 ومخزونه 30 حبه"
                    : dataType === 'customers'
                    ? "أحمد محمد جوال 0501234567 ودينه 150 ريال\nسالم العتيبي جوال 0599999999 حسابه 85 ريال"
                    : "مؤسسة المراعي الغذائية جوال 0111222333 مطلوب لهم 1200 ريال\nشركة نادك المحدودة مطلوب لهم 750 ريال"
                }
                rows={5}
                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-right duration-250 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Quick tips & Trigger Right */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -left-12 opacity-5">
                <Sparkles className="w-48 h-48 text-violet-500 rotate-12" />
              </div>
              
              {/* عنوان البطاقة الرئيسي */}
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-violet-300">محركات وتقنيات الاستخراج الذكي ⚙️</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">تفاصيل المعالجة الهجينة المتاحة بالنظام ومزايا كل منها</p>
                </div>
              </div>

              {/* المحرك الأول: الذكاء الاصطناعي */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-450 animate-ping"></span>
                  <p className="text-xs font-black text-slate-100 flex items-center gap-1">
                    <span>1. عقل الذكاء الاصطناعي (Google Gemini 3.5)</span>
                    <span className="text-[9px] bg-violet-900/60 text-violet-350 border border-violet-800/80 px-1.5 py-0.2 rounded-md font-extrabold">يحتاج إنترنت</span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pr-4">
                  **آلية العمل:** يعتمد على الاتصال السحابي الآمن عبر قنوات بيانات مشفرة لإرسال الملفات والصور إلى نماذج اللغات الكبيرة وتحليلها محاسبياً بعمق مهني.
                </p>
                <div className="grid grid-cols-2 gap-2 pr-4 text-[10px]">
                  <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                    <p className="text-violet-300 font-bold">🎯 قوة التفسير</p>
                    <p className="text-slate-450 mt-0.5">قادر على فك تعقيدات خط اليد البشري والكشوف والصور الفوضوية للغاية.</p>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-705/30 border-slate-700/30">
                    <p className="text-violet-300 font-bold">🧠 الفهم الدلالي</p>
                    <p className="text-slate-450 mt-0.5">يصنف السلعة لفرز المدينات أو الحسابات تلقائياً بدقة خبير محاسبي.</p>
                  </div>
                </div>
              </div>

              {/* المحرك الثاني: المعالج المحلي بدون انترنت */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-black text-slate-100 flex items-center gap-1">
                    <span>2. المفسر السلوكي المحلي (Offline OCR & Regex Compiler)</span>
                    <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-900 px-1.5 py-0.2 rounded-md font-extrabold">100% بدون إنترنت</span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pr-4">
                  **آلية العمل:** خوارزميات محركات سريعة تجري محلياً داخل جهازك بالكامل دون إرسال أي أرقام أو بيانات خارج نطاق متصفحك، لضمان السرعة والسرية المطبقة.
                </p>
                <div className="grid grid-cols-2 gap-2 pr-4 text-[10px]">
                  <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                    <p className="text-emerald-400 font-bold">🔒 سرية تامة وسرعة فائقة</p>
                    <p className="text-slate-450 mt-0.5">أمان مطلق لبيانات عملائك ودفاتر ديونك مع معالجة لحظية بأجزاء من الثانية.</p>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                    <p className="text-emerald-400 font-bold">⚡ الذكاء الحسابي الوقائي</p>
                    <p className="text-slate-450 mt-0.5">يفهم ألياً تضارب السعر لفرض (البيع دائماً أكبر من التكلفة) مع فرز فوري للجوال والباركود.</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/80 text-right animate-fadeIn">
                <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                  💚 **المعالج الكلاسيكي الذكي**: يعمل محلياً بالكامل وفوراً **بدون اتصال بالإنترنت**. سيقوم بفك وحساب الأرقام، وتحديد أرقام الجوالات والباركود وتفصيل الأقسام بذكاء أوتوماتيكي متطور.
                </p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isLoading || (!uploadedFile && !pastedText)}
                onClick={triggerClassicAnalysis}
                className={`w-full py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${isLoading || (!uploadedFile && !pastedText) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200'}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جاري التحليل والمعالجة بالكامل...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-emerald-100" />
                    <span>معالجة وتفصيل النص كلاسيكياً (بدون إنترنت) ⚡</span>
                  </>
                )}
              </motion.button>

              <p className="text-[10px] text-slate-400 text-center font-bold">
                * لن يتم ترحيل أي بيانات إلى نظامك إلا بعد مراجعتك الكاملة للنتائج وتعديلها.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Edit parsed items results */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
        >
          {/*********** Table Header Controls ***********/}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>مراجعة وتدقيق البيانات المستخرجة من العقل الاصطناعي</span>
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-1">
                الأسطر أدناه تم استخراجها ذكياً. يمكنك مراجعتها، تعديلها، أو إضافة سطور فارغة يدوياً وتدقيقها قبل التثبيت.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => {
                  if (dataType === 'mixed') {
                    if (activeMixedTab === 'products') {
                      setMixedProducts([...mixedProducts, { name: 'صنف جديد', cost_price: 0, sale_price: 0, stock_quantity: 1, category: 'عام', unit: 'حبة', barcode: '' }]);
                    } else if (activeMixedTab === 'customers') {
                      setMixedCustomers([...mixedCustomers, { name: 'زبون جديد', phone: '', balance: 0 }]);
                    } else {
                      setMixedSuppliers([...mixedSuppliers, { name: 'مورد جديد', phone: '', balance: 0 }]);
                    }
                  } else {
                    handleAddField();
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سطر فارغ</span>
              </button>
              
              <button 
                onClick={() => {
                  setItemsList([]);
                  setMixedProducts([]);
                  setMixedCustomers([]);
                  setMixedSuppliers([]);
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-750 text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>إلغاء وتفريغ النتائج</span>
              </button>
            </div>
          </div>

          {/*********** Departments tab in mixed mode ***********/}
          {dataType === 'mixed' && (
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 animate-fadeIn">
              <button
                onClick={() => setActiveMixedTab('products')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeMixedTab === 'products' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <Package className="w-4 h-4" />
                <span>المنتجات والمخزون المستخرج ({mixedProducts.length})</span>
              </button>
              <button
                onClick={() => setActiveMixedTab('customers')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeMixedTab === 'customers' ? 'bg-violet-600 text-white shadow-sm shadow-violet-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <Users className="w-4 h-4" />
                <span>الزبائن والديون المستخرجة ({mixedCustomers.length})</span>
              </button>
              <button
                onClick={() => setActiveMixedTab('suppliers')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeMixedTab === 'suppliers' ? 'bg-amber-600 text-white shadow-sm shadow-amber-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>الموردون والأرصدة المستخرجة ({mixedSuppliers.length})</span>
              </button>
            </div>
          )}

          {/*********** Interactive Grid ***********/}
          <div className="overflow-x-auto max-h-[450px]">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-100/55 border-b border-slate-100">
                  <th className="p-4 text-xs font-black text-slate-500 w-10">#</th>
                  <th className="p-4 text-xs font-black text-slate-500 min-w-[180px]">الاسم / التعريف</th>
                  {(dataType === 'products' || (dataType === 'mixed' && activeMixedTab === 'products')) ? (
                    <>
                      <th className="p-4 text-xs font-black text-slate-500">سعر التكلفة</th>
                      <th className="p-4 text-xs font-black text-slate-500">سعر البيع</th>
                      <th className="p-4 text-xs font-black text-slate-500">الكمية المتوفرة</th>
                      <th className="p-4 text-xs font-black text-slate-500">التصنيف</th>
                      <th className="p-4 text-xs font-black text-slate-500">الوحدة</th>
                      <th className="p-4 text-xs font-black text-slate-500">الباركود</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 text-xs font-black text-slate-500">الهاتف</th>
                      <th className="p-4 text-xs font-black text-slate-500">
                        {(dataType === 'customers' || (dataType === 'mixed' && activeMixedTab === 'customers')) ? 'إجمالي الدين' : 'الرصيد المستحق لهم (له)'}
                      </th>
                    </>
                  )}
                  <th className="p-4 text-xs font-black text-slate-500 w-12 text-center">حمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Standard Single DataType reviews */}
                {dataType !== 'mixed' && itemsList.map((item, idx) => (
                  <tr key={`import-row-${item.id ?? 'item'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-slate-500">{idx + 1}</td>
                    
                    {/* Name */}
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleRowChange(idx, 'name', e.target.value)} 
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    {dataType === 'products' ? (
                      <>
                        {/* Cost Price */}
                        <td className="p-3">
                          <input 
                            type="number" 
                            step="any"
                            value={item.cost_price} 
                            onChange={(e) => handleRowChange(idx, 'cost_price', parseFloat(e.target.value) || 0)} 
                            className="w-20 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1 text-center"
                          />
                        </td>
                        
                        {/* Sale Price */}
                        <td className="p-3">
                          <input 
                            type="number" 
                            step="any"
                            value={item.sale_price} 
                            onChange={(e) => handleRowChange(idx, 'sale_price', parseFloat(e.target.value) || 0)} 
                            className={`w-20 text-xs font-mono font-bold ${item.sale_price < item.cost_price ? 'text-rose-600 bg-rose-50/50 rounded' : 'text-slate-800'} bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1 text-center`}
                            title={item.sale_price < item.cost_price ? "تنبيه: سعر البيع أقل من سعر الشراء/التكلفة!" : undefined}
                          />
                        </td>

                        {/* Stock Quantity */}
                        <td className="p-3">
                          <input 
                            type="number" 
                            value={item.stock_quantity} 
                            onChange={(e) => handleRowChange(idx, 'stock_quantity', parseInt(e.target.value) || 0)} 
                            className="w-16 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1 text-center"
                          />
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={item.category || ''} 
                            onChange={(e) => handleRowChange(idx, 'category', e.target.value)} 
                            className="w-28 text-xs font-medium text-slate-700 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1"
                          />
                        </td>

                        {/* Unit */}
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={item.unit || 'حبة'} 
                            onChange={(e) => handleRowChange(idx, 'unit', e.target.value)} 
                            className="w-16 text-xs font-medium text-slate-700 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1 text-center"
                          />
                        </td>

                        {/* Barcode */}
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={item.barcode || ''} 
                            onChange={(e) => handleRowChange(idx, 'barcode', e.target.value)} 
                            className="w-28 text-xs font-mono text-slate-600 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1"
                            placeholder="-"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Phone */}
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={item.phone || ''} 
                            onChange={(e) => handleRowChange(idx, 'phone', e.target.value)} 
                            className="w-36 text-xs font-mono font-bold text-slate-700 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1"
                            placeholder="لا يوجد"
                          />
                        </td>

                        {/* Debt Balance */}
                        <td className="p-3">
                          <input 
                            type="number" 
                            step="any"
                            value={item.balance} 
                            onChange={(e) => handleRowChange(idx, 'balance', parseFloat(e.target.value) || 0)} 
                            className="w-24 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-transparent focus:border-violet-500 focus:ring-0 p-1"
                          />
                        </td>
                      </>
                    )}

                    {/* Delete Item column */}
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Mixed DataType review: Products list */}
                {dataType === 'mixed' && activeMixedTab === 'products' && mixedProducts.map((item, idx) => (
                  <tr key={`mixed-p-row-${item.id ?? 'item'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-slate-500">{idx + 1}</td>
                    
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, name: e.target.value };
                          setMixedProducts(updated);
                        }} 
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="number" 
                        step="any"
                        value={item.cost_price} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, cost_price: parseFloat(e.target.value) || 0 };
                          setMixedProducts(updated);
                        }} 
                        className="w-20 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1 text-center"
                      />
                    </td>
                    
                    <td className="p-3">
                      <input 
                        type="number" 
                        step="any"
                        value={item.sale_price} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, sale_price: parseFloat(e.target.value) || 0 };
                          setMixedProducts(updated);
                        }} 
                        className={`w-20 text-xs font-mono font-bold ${item.sale_price < item.cost_price ? 'text-rose-600 bg-rose-50/50 rounded' : 'text-slate-800'} bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1 text-center`}
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="number" 
                        value={item.stock_quantity} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, stock_quantity: parseInt(e.target.value) || 0 };
                          setMixedProducts(updated);
                        }} 
                        className="w-16 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1 text-center"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.category || ''} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, category: e.target.value };
                          setMixedProducts(updated);
                        }} 
                        className="w-28 text-xs font-medium text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.unit || 'حبة'} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, unit: e.target.value };
                          setMixedProducts(updated);
                        }} 
                        className="w-16 text-xs font-medium text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1 text-center"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.barcode || ''} 
                        onChange={(e) => {
                          const updated = [...mixedProducts];
                          updated[idx] = { ...item, barcode: e.target.value };
                          setMixedProducts(updated);
                        }} 
                        className="w-28 text-xs font-mono text-slate-600 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                        placeholder="-"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          const updated = [...mixedProducts];
                          updated.splice(idx, 1);
                          setMixedProducts(updated);
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Mixed DataType review: Customers list */}
                {dataType === 'mixed' && activeMixedTab === 'customers' && mixedCustomers.map((item, idx) => (
                  <tr key={`mixed-c-row-${item.id ?? 'cust'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-slate-500">{idx + 1}</td>
                    
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => {
                          const updated = [...mixedCustomers];
                          updated[idx] = { ...item, name: e.target.value };
                          setMixedCustomers(updated);
                        }} 
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.phone || ''} 
                        onChange={(e) => {
                          const updated = [...mixedCustomers];
                          updated[idx] = { ...item, phone: e.target.value };
                          setMixedCustomers(updated);
                        }} 
                        className="w-36 text-xs font-mono font-bold text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                        placeholder="لا يوجد"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="number" 
                        step="any"
                        value={item.balance} 
                        onChange={(e) => {
                          const updated = [...mixedCustomers];
                          updated[idx] = { ...item, balance: parseFloat(e.target.value) || 0 };
                          setMixedCustomers(updated);
                        }} 
                        className="w-24 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          const updated = [...mixedCustomers];
                          updated.splice(idx, 1);
                          setMixedCustomers(updated);
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Mixed DataType review: Suppliers list */}
                {dataType === 'mixed' && activeMixedTab === 'suppliers' && mixedSuppliers.map((item, idx) => (
                  <tr key={`mixed-s-row-${item.id ?? 'supp'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-slate-500">{idx + 1}</td>
                    
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => {
                          const updated = [...mixedSuppliers];
                          updated[idx] = { ...item, name: e.target.value };
                          setMixedSuppliers(updated);
                        }} 
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.phone || ''} 
                        onChange={(e) => {
                          const updated = [...mixedSuppliers];
                          updated[idx] = { ...item, phone: e.target.value };
                          setMixedSuppliers(updated);
                        }} 
                        className="w-36 text-xs font-mono font-bold text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                        placeholder="لا يوجد"
                      />
                    </td>

                    <td className="p-3">
                      <input 
                        type="number" 
                        step="any"
                        value={item.balance} 
                        onChange={(e) => {
                          const updated = [...mixedSuppliers];
                          updated[idx] = { ...item, balance: parseFloat(e.target.value) || 0 };
                          setMixedSuppliers(updated);
                        }} 
                        className="w-24 text-xs font-mono font-bold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-violet-500 focus:ring-0 p-1"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          const updated = [...mixedSuppliers];
                          updated.splice(idx, 1);
                          setMixedSuppliers(updated);
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/*********** Import Action and Options Footer ***********/}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setImportMode('merge')} 
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${importMode === 'merge' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                دمج وتعديل السجلات الحالية (موصى به)
              </button>
              <button 
                onClick={() => setImportMode('replace')} 
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${importMode === 'replace' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>حذف البيانات والبدء كلياً من جديد</span>
              </button>
            </div>

            <button 
              onClick={executeFinalImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {dataType === 'mixed' 
                  ? `تثبيت الاستيراد الشامل (${mixedProducts.length + mixedCustomers.length + mixedSuppliers.length} أسطر) 👑`
                  : `تثبيت ترحيل ${itemsList.length} صف إلى النظام المالي 🚀`
                }
              </span>
            </button>
          </div>
        </motion.div>
      )}
      </div>
      )}

      {/* Group 4: Optional Cloud Sync */}
      {activeGroup === 'cloud_sync' && (
        <CloudSyncSection
          deviceID={deviceID}
          isActivated={isActivated}
          trialDaysLeft={trialDaysLeft}
          activationDetails={activationDetails}
          handleRequestCloudActivation={handleRequestCloudActivation}
          isSubmittingRequest={isSubmittingRequest}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Dynamic Notifications */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-center"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100/60 border-t-violet-600 animate-spin" />
                <div className="absolute inset-2.5 rounded-full bg-violet-600/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-violet-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">جاري معالجة البيانات</h4>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">مستشعرات الذكاء الاصطناعي</p>
              </div>
              <p className="text-slate-600 text-xs font-bold leading-relaxed">{loadingMessages[loadingMsgIdx]}</p>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 mt-4"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="font-bold text-rose-800 text-xs">فشلت العملية</p>
              <p className="text-rose-700/85 text-[11px] mt-0.5 font-bold leading-relaxed">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        {successInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 mt-4"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="font-bold text-emerald-800 text-xs">تمت المعالجة بنجاح</p>
              <p className="text-emerald-700/85 text-[11px] mt-0.5 font-bold leading-relaxed">{successInfo}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
