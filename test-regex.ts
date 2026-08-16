const pattern = /كم (سعر|كميه|مخزون|باقي|متبقي|رصيد|حبات) (من )?(المنتج|الصنف|[أ-ي\s]+)/i;
console.log(pattern.test('كم باقي من حليب المراعي؟'));
console.log(pattern.test('كم رصيد من حليب المراعي؟'));
