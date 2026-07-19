export interface OnlineProductData {
  name: string;
  category?: string;
  image_url?: string;
  unit?: string;
}

function deduceUnit(name: string, category: string): string {
  const text = (name + ' ' + category).toLowerCase();
  if (text.includes('مشروب') || text.includes('drink') || text.includes('beverage') || text.includes('juice') || text.includes('عصير') || text.includes('ماء') || text.includes('water')) {
    return 'عبوة';
  }
  if (text.includes('كجم') || text.includes('kg') || text.includes('كيلو')) {
    return 'كجم';
  }
  if (text.includes('جرام') || text.includes('gram') || text.includes(' g ')) {
    return 'جرام';
  }
  if (text.includes('لتر') || text.includes('liter') || text.includes(' ml ') || text.includes('مل')) {
    return 'عبوة';
  }
  if (text.includes('كرتون') || text.includes('box') || text.includes('carton')) {
    return 'كرتون';
  }
  if (text.includes('كيس') || text.includes('bag')) {
    return 'كيس';
  }
  return 'حبة'; // default unit
}

export async function lookupBarcodeOnline(barcode: string): Promise<OnlineProductData | null> {
  try {
    const response = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        unit: deduceUnit(data.name, data.category || '')
      };
    }
    return null;
  } catch (error) {
    console.error("Error looking up barcode online:", error);
    return null;
  }
}
