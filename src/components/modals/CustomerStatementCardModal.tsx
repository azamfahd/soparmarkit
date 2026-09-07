import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Download, Copy, Share2, MessageCircle, X, Check, Store, Calendar, ShieldCheck, User, Phone, Layers } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { saveCanvasImageToDevice } from '../../utils/fileSaver';

export interface CustomerStatementCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  storeName: string;
  storePhone?: string;
  currency: string;
  monthLabel: string;
  ledgerEntries: any[];
  customerStats: { totalPurchased: number; totalPaid: number };
  formatPrice: (amount: number) => string;
  formatDateTimeWithDay: (dateStr: string) => string;
}

export const CustomerStatementCardModal: React.FC<CustomerStatementCardModalProps> = ({
  isOpen,
  onClose,
  customer,
  storeName,
  storePhone = '',
  currency,
  monthLabel,
  ledgerEntries,
  customerStats,
  formatPrice,
  formatDateTimeWithDay,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'corporate' | 'modern_light' | 'gold_vip'>('modern_light');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !customer) return null;

  // Calculate totals for the selected list of entries
  let purchasedInPeriod = 0;
  let paidInPeriod = 0;

  ledgerEntries.forEach(entry => {
    if (entry.entryType === 'sale') {
      purchasedInPeriod += entry.total_amount || 0;
    } else {
      if (entry.type === 'purchase') {
        purchasedInPeriod += entry.amount || 0;
      } else if (entry.type === 'payment' || entry.amount > 0) {
        paidInPeriod += entry.amount || 0;
      }
    }
  });

  const netBalance = customer.balance;

  const safeHtml2Canvas = async (element: HTMLElement) => {
    // Mathematical OKLCH to sRGB conversion
    const oklchToRgb = (l: number, c: number, h: number, alpha?: number): string => {
      // Convert hue to radians
      const hRad = (h * Math.PI) / 180;
      const a = c * Math.cos(hRad);
      const bVal = c * Math.sin(hRad);

      // Oklab to LMS
      const l_lms = l + 0.3963377774 * a + 0.2158037573 * bVal;
      const m_lms = l - 0.1055613458 * a - 0.0638541728 * bVal;
      const s_lms = l - 0.0894841775 * a - 1.2914855480 * bVal;

      // LMS to linear sRGB
      const l_lin = Math.pow(Math.max(0, l_lms), 3);
      const m_lin = Math.pow(Math.max(0, m_lms), 3);
      const s_lin = Math.pow(Math.max(0, s_lms), 3);

      // Linear sRGB to RGB matrix
      const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
      const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
      const b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

      // Gamma correction
      const gamma = (val: number) => {
        return val <= 0.0031308
          ? 12.92 * val
          : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
      };

      const red = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
      const green = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
      const blue = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));

      if (alpha !== undefined) {
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      }
      return `rgb(${red}, ${green}, ${blue})`;
    };

    // Mathematical Oklab to sRGB conversion
    const oklabToRgb = (l: number, a: number, bVal: number, alpha?: number): string => {
      // Oklab to LMS
      const l_lms = l + 0.3963377774 * a + 0.2158037573 * bVal;
      const m_lms = l - 0.1055613458 * a - 0.0638541728 * bVal;
      const s_lms = l - 0.0894841775 * a - 1.2914855480 * bVal;

      // LMS to linear sRGB
      const l_lin = Math.pow(Math.max(0, l_lms), 3);
      const m_lin = Math.pow(Math.max(0, m_lms), 3);
      const s_lin = Math.pow(Math.max(0, s_lms), 3);

      // Linear sRGB to RGB matrix
      const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
      const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
      const b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

      // Gamma correction
      const gamma = (val: number) => {
        return val <= 0.0031308
          ? 12.92 * val
          : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
      };

      const red = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
      const green = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
      const blue = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));

      if (alpha !== undefined) {
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      }
      return `rgb(${red}, ${green}, ${blue})`;
    };

    const transformCssText = (cssText: string): string => {
      // Extract CSS variables first
      const variableMap: Record<string, string> = {};
      const matches = cssText.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g);
      for (const match of matches) {
        variableMap[`--${match[1]}`] = match[2].trim();
      }

      // Resolve nested variables recursively (up to 3 levels)
      for (let i = 0; i < 3; i++) {
        for (const key in variableMap) {
          variableMap[key] = variableMap[key].replace(/var\((--[a-zA-Z0-9_-]+)\)/g, (m, varName) => {
            return variableMap[varName] || m;
          });
        }
      }

      // Recursive color function replacement
      const replaceColorFunctions = (text: string): string => {
        let pos = 0;
        while (true) {
          const oklchIdx = text.indexOf('oklch(', pos);
          const oklabIdx = text.indexOf('oklab(', pos);
          const colorMixIdx = text.indexOf('color-mix(', pos);
          
          let minIdx = -1;
          let type: 'oklch' | 'oklab' | 'color-mix' | null = null;
          
          if (oklchIdx !== -1 && (minIdx === -1 || oklchIdx < minIdx)) {
            minIdx = oklchIdx;
            type = 'oklch';
          }
          if (oklabIdx !== -1 && (minIdx === -1 || oklabIdx < minIdx)) {
            minIdx = oklabIdx;
            type = 'oklab';
          }
          if (colorMixIdx !== -1 && (minIdx === -1 || colorMixIdx < minIdx)) {
            minIdx = colorMixIdx;
            type = 'color-mix';
          }
          
          if (minIdx === -1) {
            break;
          }
          
          let depth = 1;
          let endIdx = -1;
          const startContentIdx = minIdx + (type === 'color-mix' ? 10 : 6);
          for (let i = startContentIdx; i < text.length; i++) {
            if (text[i] === '(') {
              depth++;
            } else if (text[i] === ')') {
              depth--;
              if (depth === 0) {
                endIdx = i;
                break;
              }
            }
          }
          
          if (endIdx === -1) {
            pos = startContentIdx;
            continue;
          }
          
          const content = text.substring(startContentIdx, endIdx);
          const resolvedContent = replaceColorFunctions(content);
          
          let replacement = '#475569';
          if (type === 'oklch') {
            replacement = resolveSingleOklch(resolvedContent);
          } else if (type === 'oklab') {
            replacement = resolveSingleOklab(resolvedContent);
          } else if (type === 'color-mix') {
            replacement = resolveSingleColorMix(resolvedContent);
          }
          
          text = text.substring(0, minIdx) + replacement + text.substring(endIdx + 1);
          pos = minIdx + replacement.length;
        }
        return text;
      };

      const resolveSingleOklch = (content: string): string => {
        try {
          const parts = content.trim().split(/[\s,]+/);
          if (parts.length < 3) return '#475569';
          
          let l = parseFloat(parts[0]);
          if (parts[0].endsWith('%')) l = l / 100;
          
          let c = parseFloat(parts[1]);
          if (parts[1].endsWith('%')) c = c / 100;
          
          let h = parseFloat(parts[2]);
          if (parts[2].endsWith('deg')) h = parseFloat(parts[2]);
          
          let alpha: number | undefined = undefined;
          const slashIdx = content.indexOf('/');
          if (slashIdx !== -1) {
            const alphaStr = content.substring(slashIdx + 1).trim();
            if (alphaStr.endsWith('%')) {
              alpha = parseFloat(alphaStr) / 100;
            } else {
              alpha = parseFloat(alphaStr);
            }
          }
          
          return oklchToRgb(l, c, h, alpha);
        } catch (e) {
          return '#475569';
        }
      };

      const resolveSingleOklab = (content: string): string => {
        try {
          const parts = content.trim().split(/[\s,]+/);
          if (parts.length < 3) return '#475569';
          
          let l = parseFloat(parts[0]);
          if (parts[0].endsWith('%')) l = l / 100;
          
          let a = parseFloat(parts[1]);
          let bValLocal = parseFloat(parts[2]);
          
          let alpha: number | undefined = undefined;
          const slashIdx = content.indexOf('/');
          if (slashIdx !== -1) {
            const alphaStr = content.substring(slashIdx + 1).trim();
            if (alphaStr.endsWith('%')) {
              alpha = parseFloat(alphaStr) / 100;
            } else {
              alpha = parseFloat(alphaStr);
            }
          }
          
          return oklabToRgb(l, a, bValLocal, alpha);
        } catch (e) {
          return '#475569';
        }
      };

      const resolveSingleColorMix = (content: string): string => {
        try {
          let clean = content.replace(/^in\s+srgb\s*,/i, '').trim();
          let commaIdx = -1;
          let depth = 0;
          for (let i = 0; i < clean.length; i++) {
            if (clean[i] === '(') depth++;
            else if (clean[i] === ')') depth--;
            else if (clean[i] === ',' && depth === 0) {
              commaIdx = i;
              break;
            }
          }
          
          if (commaIdx === -1) return '#475569';
          
          const part1 = clean.substring(0, commaIdx).trim();
          const part2 = clean.substring(commaIdx + 1).trim();
          
          const parsePart = (part: string) => {
            const pctMatch = part.match(/([0-9.]+)%/);
            const pct = pctMatch ? parseFloat(pctMatch[1]) / 100 : null;
            let colorStr = part.replace(/[0-9.]+%/, '').trim();
            return { color: colorStr, pct };
          };
          
          const p1 = parsePart(part1);
          const p2 = parsePart(part2);
          
          let w1 = 0.5;
          let w2 = 0.5;
          if (p1.pct !== null && p2.pct !== null) {
            w1 = p1.pct;
            w2 = p2.pct;
          } else if (p1.pct !== null) {
            w1 = p1.pct;
            w2 = 1 - w1;
          } else if (p2.pct !== null) {
            w2 = p2.pct;
            w1 = 1 - w2;
          }
          
          const toRgba = (col: string) => {
            col = col.toLowerCase().trim();
            if (col === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
            if (col === 'white') return { r: 255, g: 255, b: 255, a: 1 };
            if (col === 'black') return { r: 0, g: 0, b: 0, a: 1 };
            
            const rgbaMatch = col.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
            if (rgbaMatch) {
              return {
                r: parseFloat(rgbaMatch[1]),
                g: parseFloat(rgbaMatch[2]),
                b: parseFloat(rgbaMatch[3]),
                a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
              };
            }
            
            const hexMatch = col.match(/#([0-9a-f]{3,8})/);
            if (hexMatch) {
              let hex = hexMatch[1];
              if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const a = hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
              return { r, g, b, a };
            }
            
            return { r: 71, g: 85, b: 105, a: 1 };
          };
          
          const c1 = toRgba(p1.color);
          const c2 = toRgba(p2.color);
          
          const mixedA = c1.a * w1 + c2.a * w2;
          if (mixedA <= 0) return 'rgba(0, 0, 0, 0)';
          
          const mixedR = Math.round((c1.r * c1.a * w1 + c2.r * c2.a * w2) / mixedA);
          const mixedG = Math.round((c1.g * c1.a * w1 + c2.g * c2.a * w2) / mixedA);
          const mixedB = Math.round((c1.b * c1.a * w1 + c2.b * c2.a * w2) / mixedA);
          
          return `rgba(${mixedR}, ${mixedG}, ${mixedB}, ${mixedA.toFixed(3)})`;
        } catch (e) {
          return '#475569';
        }
      };

      let substitutedCss = cssText.replace(/var\((--[a-zA-Z0-9_-]+)\)/g, (m, varName) => {
        return variableMap[varName] || m;
      });

      return replaceColorFunctions(substitutedCss);
    };

    const prepareStylesheets = async () => {
      const styleTags = Array.from(document.querySelectorAll('style'));
      const restoredStyles: { tag: HTMLStyleElement; originalText: string }[] = [];
      
      styleTags.forEach((tag) => {
        if (tag.textContent) {
          restoredStyles.push({ tag, originalText: tag.textContent });
          tag.textContent = transformCssText(tag.textContent);
        }
      });

      const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      const restoredLinks: { tag: HTMLLinkElement; originalRel: string }[] = [];
      const temporaryStyleTags: HTMLStyleElement[] = [];

      for (const link of linkTags) {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            const transformedCss = transformCssText(cssText);
            
            const tempStyle = document.createElement('style');
            tempStyle.textContent = transformedCss;
            document.head.appendChild(tempStyle);
            temporaryStyleTags.push(tempStyle);

            restoredLinks.push({ tag: link, originalRel: link.rel });
            link.rel = 'stylesheet-disabled';
            link.disabled = true;
          }
        } catch (e) {
          console.warn('Failed to fetch/transform external stylesheet:', link.href, e);
        }
      }

      return {
        restore: () => {
          restoredStyles.forEach(({ tag, originalText }) => {
            tag.textContent = originalText;
          });
          restoredLinks.forEach(({ tag, originalRel }) => {
            tag.rel = originalRel;
            tag.disabled = false;
          });
          temporaryStyleTags.forEach((tag) => tag.remove());
        }
      };
    };

    // Prepare active stylesheets before html2canvas executes
    const stylePreparation = await prepareStylesheets();

    const bgColor = theme === 'corporate' 
      ? '#020617' 
      : theme === 'gold_vip' 
      ? '#0d0d11' 
      : '#ffffff';

    try {
      return await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          // Process element inline styles in cloned DOM
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText) {
              htmlEl.style.cssText = transformCssText(htmlEl.style.cssText);
            }
          });

          // Explicitly force dark background and clean hex gradients/borders on cloned elements
          // to completely bypass oklch-to-rgb and Tailwind v4 CSS variable gradient rendering limitations
          const clonedCard = clonedDoc.getElementById('statement-card-downloadable');
          if (clonedCard) {
            clonedCard.style.setProperty('background-color', bgColor, 'important');
            clonedCard.style.setProperty('background-image', 'none', 'important');
            
            if (theme === 'corporate') {
              clonedCard.style.setProperty('color', '#ffffff', 'important');
              clonedCard.style.setProperty('border', '1px solid #1e293b', 'important');
            } else if (theme === 'gold_vip') {
              clonedCard.style.setProperty('color', '#fef3c7', 'important');
              clonedCard.style.setProperty('border', '1px solid #78350f', 'important');
            } else {
              clonedCard.style.setProperty('color', '#0f172a', 'important');
              clonedCard.style.setProperty('border', '2px solid rgba(5, 150, 105, 0.3)', 'important');
            }
          }

          // Format child containers inside the cloned card
          const clonedCustomerInfo = clonedDoc.getElementById('statement-customer-info-card');
          if (clonedCustomerInfo) {
            if (theme !== 'modern_light') {
              clonedCustomerInfo.style.setProperty('background-color', '#1e293b', 'important');
              clonedCustomerInfo.style.setProperty('border-color', '#334155', 'important');
            } else {
              clonedCustomerInfo.style.setProperty('background-color', '#f8fafc', 'important');
              clonedCustomerInfo.style.setProperty('border-color', '#e2e8f0', 'important');
            }
          }

          const clonedSummaryPurchases = clonedDoc.getElementById('statement-summary-badge-purchases');
          if (clonedSummaryPurchases) {
            if (theme !== 'modern_light') {
              clonedSummaryPurchases.style.setProperty('background-color', '#172554', 'important');
              clonedSummaryPurchases.style.setProperty('border-color', '#1e3a8a', 'important');
            } else {
              clonedSummaryPurchases.style.setProperty('background-color', '#eff6ff', 'important');
              clonedSummaryPurchases.style.setProperty('border-color', '#dbeafe', 'important');
            }
          }

          const clonedSummaryPayments = clonedDoc.getElementById('statement-summary-badge-payments');
          if (clonedSummaryPayments) {
            if (theme !== 'modern_light') {
              clonedSummaryPayments.style.setProperty('background-color', '#022c22', 'important');
              clonedSummaryPayments.style.setProperty('border-color', '#064e3b', 'important');
            } else {
              clonedSummaryPayments.style.setProperty('background-color', '#ecfdf5', 'important');
              clonedSummaryPayments.style.setProperty('border-color', '#d1fae5', 'important');
            }
          }

          const clonedSummaryBalance = clonedDoc.getElementById('statement-summary-badge-balance');
          if (clonedSummaryBalance) {
            if (theme !== 'modern_light') {
              if (netBalance > 0) {
                clonedSummaryBalance.style.setProperty('background-color', '#881337', 'important');
                clonedSummaryBalance.style.setProperty('border-color', '#9f1239', 'important');
              } else {
                clonedSummaryBalance.style.setProperty('background-color', '#1e293b', 'important');
                clonedSummaryBalance.style.setProperty('border-color', '#334155', 'important');
              }
            } else {
              if (netBalance > 0) {
                clonedSummaryBalance.style.setProperty('background-color', '#fff1f2', 'important');
                clonedSummaryBalance.style.setProperty('border-color', '#fecdd3', 'important');
              } else {
                clonedSummaryBalance.style.setProperty('background-color', '#f1f5f9', 'important');
                clonedSummaryBalance.style.setProperty('border-color', '#e2e8f0', 'important');
              }
            }
          }

          const clonedTableContainer = clonedDoc.getElementById('statement-table-container');
          if (clonedTableContainer) {
            if (theme !== 'modern_light') {
              clonedTableContainer.style.setProperty('background-color', '#0f172a', 'important');
              clonedTableContainer.style.setProperty('border-color', '#1e293b', 'important');
            } else {
              clonedTableContainer.style.setProperty('background-color', '#ffffff', 'important');
              clonedTableContainer.style.setProperty('border-color', '#e2e8f0', 'important');
            }
          }

          const clonedTableHeader = clonedDoc.getElementById('statement-table-header');
          if (clonedTableHeader) {
            if (theme !== 'modern_light') {
              clonedTableHeader.style.setProperty('background-color', '#1e293b', 'important');
              clonedTableHeader.style.setProperty('color', '#cbd5e1', 'important');
            } else {
              clonedTableHeader.style.setProperty('background-color', '#f1f5f9', 'important');
              clonedTableHeader.style.setProperty('color', '#334155', 'important');
            }
          }
        },
      });
    } finally {
      // Restore all original styles and links instantly
      stylePreparation.restore();
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await safeHtml2Canvas(cardRef.current);
      const fileName = `كشف_حساب_${customer.name}_${monthLabel.replace(/\s+/g, '_')}.png`;
      await saveCanvasImageToDevice(canvas, fileName);
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFormattedWhatsAppText = () => {
    const statusText = netBalance > 0
      ? `🔴 *المبلغ المتبقي المستحق:* ${formatPrice(netBalance)}`
      : netBalance < 0
      ? `🟢 *رصيد دائن متوفر لحسابك:* ${formatPrice(Math.abs(netBalance))}`
      : `✅ *الحساب خالص تماماً (0 ${currency})*`;

    const detailsList = ledgerEntries.map(entry => {
      let isSale = entry.entryType === 'sale';
      let isPayment = !isSale && (entry.type === 'payment' || entry.amount > 0);
      let dateStr = formatDateTimeWithDay(entry.created_at);
      let title = isSale ? `فاتورة شراء #${entry.id || ''}` : (entry.notes || (entry.type === 'purchase' ? 'زيادة حساب' : 'دفعة سداد'));
      let amtText = isSale ? `+${formatPrice(entry.total_amount)}` : isPayment ? `-${formatPrice(entry.amount)}` : `+${formatPrice(entry.amount)}`;

      let itemsStr = '';
      if (isSale && entry.items) {
        try {
          const parsed = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
          if (Array.isArray(parsed) && parsed.length > 0) {
            itemsStr = '\n   📦 الأصناف: ' + parsed.map((i: any) => `${i.name}${i.quantity > 1 ? ` (×${i.quantity})` : ''}`).join('، ');
          }
        } catch (e) {}
      }

      return `▫️ ${dateStr}\n   ${title}: *${amtText}*${itemsStr}`;
    }).join('\n\n');

    return `🧾 *كشف حساب رسمي - ${storeName}*
👤 *العميل المكرم:* ${customer.name}
📅 *الفترة / الفترة الزمنية:* ${monthLabel}
----------------------------------
🛍️ *إجمالي مشتريات الفترة:* ${formatPrice(purchasedInPeriod)}
💵 *إجمالي المبالغ المسددة:* ${formatPrice(paidInPeriod)}
----------------------------------
📌 ${statusText}

📋 *تفاصيل العمليات والأصناف:*
${detailsList}

----------------------------------
شاكرين لكم حسن تعاونكم ودائمين في خدمتكم 🌹
📞 للتواصل والاستفسار: ${storePhone || 'عبر هذا الرقم'}`;
  };

  const handleSendWhatsAppText = () => {
    const text = getFormattedWhatsAppText();
    const phone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyText = async () => {
    const text = getFormattedWhatsAppText();
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await safeHtml2Canvas(cardRef.current);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `كشف_حساب_${customer.name}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `كشف حساب - ${customer.name}`,
            text: getFormattedWhatsAppText(),
            files: [file],
          });
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (e) {
      console.error('Share error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div key="modal-customer-statement-card-backdrop" className="fixed inset-0 bg-slate-900/80 z-[90] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="bg-slate-900 text-white p-2.5 sm:p-3 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-snug">بطاقة كشف الحساب الاحترافية</h3>
                <p className="text-[11px] text-slate-400 hidden sm:block">معاينة وتصميم بطاقة كشف الحساب بصورة عالية الجودة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Selector Bar */}
          <div className="bg-slate-100 py-1.5 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> الطراز:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('corporate')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  theme === 'corporate'
                    ? 'bg-slate-900 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                🌌 كحلي
              </button>
              <button
                type="button"
                onClick={() => setTheme('modern_light')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  theme === 'modern_light'
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-400'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                ✨ أبيض
              </button>
              <button
                type="button"
                onClick={() => setTheme('gold_vip')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  theme === 'gold_vip'
                    ? 'bg-amber-900 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                👑 VIP
              </button>
            </div>
          </div>

          {/* Scrollable Preview Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70 flex justify-center items-start">
            {/* The Actual Renderable Card Node */}
            <div
              ref={cardRef}
              id="statement-card-downloadable"
              dir="rtl"
              className={`w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl transition-all font-sans relative overflow-hidden my-auto sm:my-0 shrink-0 ${
                theme === 'corporate'
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800'
                  : theme === 'modern_light'
                  ? 'bg-white text-slate-900 border-2 border-emerald-600/30 shadow-emerald-900/5'
                  : 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-amber-50 border border-amber-600/40'
              }`}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>

              {/* Top Header Section */}
              <div className="flex justify-between items-start border-b border-slate-500/20 pb-5 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Store className={`w-5 h-5 ${theme === 'modern_light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <h2 className="text-xl font-black leading-tight">{storeName}</h2>
                  </div>
                  <p className={`text-xs ${theme === 'modern_light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    كشف حساب عميل موثق رسمياً
                  </p>
                </div>
                <div className="text-left">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                    theme === 'modern_light' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {monthLabel}
                  </span>
                  <p className={`text-[10px] mt-1.5 ${theme === 'modern_light' ? 'text-slate-400' : 'text-slate-400'}`}>
                    تاريخ الاصدار: {formatDateTimeWithDay(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Customer Info Card */}
              <div 
                id="statement-customer-info-card"
                className={`p-4 rounded-xl border mb-5 flex justify-between items-center ${
                  theme === 'modern_light'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    theme === 'modern_light' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{customer.name}</h3>
                    <p className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'modern_light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Phone className="w-3 h-3" /> {customer.phone || 'بدون هاتف'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    netBalance > 0
                      ? theme === 'modern_light' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : netBalance < 0
                      ? theme === 'modern_light' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : theme === 'modern_light' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                  }`}>
                    {netBalance > 0 ? 'مستحق الدفع' : netBalance < 0 ? 'رصيد دائن' : 'حساب خالص'}
                  </span>
                </div>
              </div>

              {/* Financial Summary Badges */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div 
                  id="statement-summary-badge-purchases"
                  className={`p-3 rounded-xl border text-center ${
                    theme === 'modern_light' ? 'bg-blue-50/80 border-blue-100' : 'bg-blue-950/40 border-blue-800/40'
                  }`}
                >
                  <p className={`text-[10px] font-bold mb-1 ${theme === 'modern_light' ? 'text-blue-700' : 'text-blue-300'}`}>
                    مشتريات الفترة
                  </p>
                  <p className={`text-sm font-black ${theme === 'modern_light' ? 'text-blue-900' : 'text-blue-100'}`}>
                    {formatPrice(purchasedInPeriod)}
                  </p>
                </div>

                <div 
                  id="statement-summary-badge-payments"
                  className={`p-3 rounded-xl border text-center ${
                    theme === 'modern_light' ? 'bg-emerald-50/80 border-emerald-100' : 'bg-emerald-950/40 border-emerald-800/40'
                  }`}
                >
                  <p className={`text-[10px] font-bold mb-1 ${theme === 'modern_light' ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    المبالغ المسددة
                  </p>
                  <p className={`text-sm font-black ${theme === 'modern_light' ? 'text-emerald-900' : 'text-emerald-100'}`}>
                    {formatPrice(paidInPeriod)}
                  </p>
                </div>

                <div 
                  id="statement-summary-badge-balance"
                  className={`p-3 rounded-xl border text-center ${
                    netBalance > 0
                      ? theme === 'modern_light' ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/50 border-rose-800/50'
                      : theme === 'modern_light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <p className={`text-[10px] font-bold mb-1 ${
                    netBalance > 0 
                      ? theme === 'modern_light' ? 'text-rose-700' : 'text-rose-300'
                      : theme === 'modern_light' ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    الرصيد المتبقي الكلي
                  </p>
                  <p className={`text-sm font-black ${
                    netBalance > 0 
                      ? theme === 'modern_light' ? 'text-rose-900' : 'text-rose-200'
                      : theme === 'modern_light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {formatPrice(netBalance)}
                  </p>
                </div>
              </div>

              {/* Transactions Timeline / List Snippet */}
              <div className="mb-5">
                <h4 className={`text-sm font-black mb-3 flex items-center justify-between ${
                  theme === 'modern_light' ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    سجل العمليات التفصيلي ({ledgerEntries.length})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md opacity-80 bg-slate-500/10">البيان المالي</span>
                </h4>

                <div 
                  id="statement-table-container"
                  className="flex flex-col gap-2.5"
                >
                  {ledgerEntries.map((entry, idx) => {
                    let isSale = entry.entryType === 'sale';
                    let isPayment = !isSale && (entry.type === 'payment' || entry.amount > 0);
                    let title = isSale
                      ? `فاتورة مبيعات #${entry.id || ''}`
                      : entry.notes || (entry.type === 'purchase' ? 'زيادة حساب' : 'دفعة سداد');

                    let itemsSummary = '';
                    if (isSale && entry.items) {
                      try {
                        const parsed = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          itemsSummary = parsed.map((i: any) => `${i.name || i.product_name}${i.quantity > 1 ? ` (×${i.quantity})` : ''}`).join('، ');
                        }
                      } catch (e) {}
                    }

                    let statusBadge = null;
                    if (isSale) {
                      const totalAmount = entry.total_amount || 0;
                      const paidAmount = entry.paid_amount !== undefined 
                        ? entry.paid_amount 
                        : (entry.payment_type === 'cash' ? totalAmount : 0);
                      const paymentStatus = entry.payment_status || (paidAmount === 0 ? 'unpaid' : paidAmount < totalAmount ? 'partial' : paidAmount === totalAmount ? 'paid' : 'overpaid');

                      if (paymentStatus === 'unpaid') {
                        statusBadge = <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">🔴 آجل بالكامل</span>;
                      } else if (paymentStatus === 'partial') {
                        statusBadge = <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap">🟡 سدد {formatPrice(paidAmount)}</span>;
                      } else if (paymentStatus === 'overpaid') {
                        statusBadge = <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-yellow-100 text-yellow-900 border border-yellow-300 whitespace-nowrap">⭐ فائض {formatPrice(paidAmount - totalAmount)}</span>;
                      } else {
                        statusBadge = <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">🟢 مدفوع نقداً</span>;
                      }
                    }

                    let amtText = isSale ? formatPrice(entry.total_amount) : formatPrice(entry.amount);

                    return (
                      <div 
                        key={`card-tr-${idx}`} 
                        className={`p-3 sm:p-3.5 rounded-xl border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
                          theme === 'modern_light' 
                            ? 'bg-white border-slate-200/80' 
                            : 'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        {/* Edge indicator */}
                        <div className={`absolute top-0 bottom-0 right-0 w-1 ${
                          isSale ? 'bg-rose-500' : isPayment ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}></div>

                        <div className="flex flex-col gap-1.5 pr-2.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-bold text-[13px] ${theme === 'modern_light' ? 'text-slate-800' : 'text-slate-100'}`}>
                              {title}
                            </span>
                            {statusBadge}
                          </div>
                          
                          <span className={`text-[10px] font-medium flex items-center gap-1.5 ${theme === 'modern_light' ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {formatDateTimeWithDay(entry.created_at)}
                          </span>

                          {(itemsSummary || entry.notes) && (
                            <div className="mt-1 space-y-1">
                              {itemsSummary && (
                                <div className={`text-[10px] leading-relaxed p-1.5 rounded-md inline-block max-w-full ${
                                  theme === 'modern_light' ? 'bg-slate-50 text-slate-600 border border-slate-100' : 'bg-slate-900/50 text-slate-300 border border-slate-700/50'
                                }`}>
                                  <span className={theme === 'modern_light' ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}>
                                    الأصناف: 
                                  </span>{' '}
                                  {itemsSummary}
                                </div>
                              )}
                              {entry.notes && (
                                <div className={`text-[10px] leading-tight flex items-start gap-1 p-1.5 rounded-md inline-block max-w-full ${
                                  theme === 'modern_light' ? 'bg-blue-50/50 text-slate-600 border border-blue-100/50' : 'bg-blue-900/20 text-slate-300 border border-blue-800/30'
                                }`}>
                                  <span className="shrink-0 text-[11px]">💡</span> 
                                  <span className="font-medium">{entry.notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-left shrink-0 self-end sm:self-center pr-2 sm:pr-0">
                           <p className={`text-base sm:text-lg font-black font-mono flex items-center justify-end gap-1 ${
                              isSale 
                                ? theme === 'modern_light' ? 'text-rose-600' : 'text-rose-400'
                                : isPayment 
                                ? theme === 'modern_light' ? 'text-emerald-600' : 'text-emerald-400'
                                : theme === 'modern_light' ? 'text-amber-600' : 'text-amber-400'
                            }`}>
                             <span className="text-xs font-sans opacity-70">{isSale ? '+' : isPayment ? '-' : '+'}</span>
                             {amtText}
                           </p>
                           {isSale && (
                             <p className={`text-[9px] font-bold ${theme === 'modern_light' ? 'text-slate-400' : 'text-slate-500'}`}>إجمالي الفاتورة</p>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Official Seal & Footer */}
              <div className="pt-4 border-t border-slate-500/20 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 opacity-80">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>وثيقة مطابقة إلكترونياً من نظام {storeName}</span>
                </div>
                {storePhone && (
                  <div className="opacity-80">
                    رقم التواصل: {storePhone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-slate-900 p-2.5 sm:p-3 px-4 border-t border-slate-800 flex flex-wrap gap-1.5 justify-between items-center shrink-0">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isGenerating ? 'جاري التوليد...' : 'تحميل صورة'}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsAppText}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                مشاركة واتساب
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyText}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                title="نسخ نص التقرير للواتساب"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? 'تم النسخ' : 'نسخ النص'}
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                title="مشاركة الصورة والنص"
              >
                <Share2 className="w-3.5 h-3.5" />
                مشاركة
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
