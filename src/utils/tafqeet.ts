/**
 * Converts numbers to Arabic words (Tafqeet / تفقيط الأرقام)
 * Specially tailored for official receipts and vouchers.
 */

const ones: string[] = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];

const tens: string[] = [
  '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'
];

const hundreds: string[] = [
  '', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
];

function convertGroup(num: number): string {
  let result = '';
  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    result += hundreds[h];
  }

  if (remainder > 0) {
    if (result.length > 0) result += ' و';
    if (remainder < 20) {
      result += ones[remainder];
    } else {
      const o = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (o > 0) {
        result += ones[o] + ' و' + tens[t];
      } else {
        result += tens[t];
      }
    }
  }

  return result;
}

export function tafqeetArabic(num: number, currency = 'ريال'): string {
  if (isNaN(num) || num === 0) return `صفر ${currency} فقط لا غير`;

  const absNum = Math.abs(Math.round(num));
  let result = '';

  const billions = Math.floor(absNum / 1000000000);
  let rem = absNum % 1000000000;

  const millions = Math.floor(rem / 1000000);
  rem = rem % 1000000;

  const thousands = Math.floor(rem / 1000);
  const onesGroup = rem % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push('مليار');
    else if (billions === 2) parts.push('ملياران');
    else parts.push(`${convertGroup(billions)} مليار`);
  }

  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else parts.push(`${convertGroup(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertGroup(thousands)} آلاف`);
    else parts.push(`${convertGroup(thousands)} ألف`);
  }

  if (onesGroup > 0) {
    parts.push(convertGroup(onesGroup));
  }

  result = parts.join(' و');

  return `فقط ${result} ${currency} لا غير`;
}
