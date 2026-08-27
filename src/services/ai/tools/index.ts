import { NLUResult, Evidence } from '../types';
import {
  getSalesSummaryTool,
  getProfitSummaryTool,
  getCustomerDebtsTool,
  getCustomerStatementTool,
  getSupplierDebtsTool,
  getSupplierStatementTool,
  getSupplierPaymentsTool,
  getCustomerPaymentsTool,
  getPurchasesSummaryTool,
  getInventoryStatusTool,
  getLowStockReportTool,
  getExpiredAndExpiringReportTool,
  getSalesByProductTool,
  getInvoiceSearchTool,
  getCashSummaryTool,
  getNotesAndRemindersTool,
  getAnomalyDetectionTool,
  getFinancialReportTool,
  getForecastTool,
  getTaxReportTool,
  getTopSellingProductsTool,
  getPOSShiftSummaryTool,
  getLargestSaleTool,
  getDrilldownExplanationTool,
  getSalesComparisonTool,
  getDiagnosticAnalysisTool,
  getGrowthStrategyTool,
  getCustomerCollectionRateTool,
  getCashFlowStatementTool,
  getUnpaidInvoicesTool,
  getSuppliersDueTool,
  getInventoryValuationTool,
  getStoreHealthDiagnosticTool,
  getPerformanceComparisonTool,
  getTopRevenueOrProfitProductsTool,
  getTopDebtorsTool,
  checkNameAmbiguityTool,
  getProductProfitAndSalesTool,
  getFullSystemAuditTool,
  getSupplierPaymentsByDateTool,
  getCreditSalesSummaryTool,
  getWithdrawalsAndAdjustmentsTool,
  getSystemDictionaryExplanationTool,
} from './accountingTools';

export async function executeTools(nluResult: NLUResult, memoryContext?: any): Promise<Evidence[]> {
  const { intent, entities } = nluResult;
  const evidences: Evidence[] = [];

  // Extract common parameters from entities
  const dateRangeEntity = entities.find(e => e.type === 'DATE_RANGE');
  const dateRange = dateRangeEntity ? (dateRangeEntity.value as string) : (memoryContext?.activeEntities?.dateRange || 'ALL');

  const targetNameEntity = entities.find(e => e.type === 'TARGET_NAME');
  const targetName = targetNameEntity ? targetNameEntity.value : (memoryContext?.activeEntities?.targetName);

  const invoiceIdEntity = entities.find(e => e.type === 'INVOICE_ID');
  const invoiceId = invoiceIdEntity ? invoiceIdEntity.value : (memoryContext?.activeEntities?.invoiceId);

  const isVerification = entities.some(e => e.type === 'IS_VERIFICATION');

  switch (intent.name) {
    case 'FULL_SYSTEM_AUDIT_REPORT': {
      const auditDateRange = dateRangeEntity ? (dateRangeEntity.value as string) : (memoryContext?.activeEntities?.dateRange || 'ALL');
      const fullAuditEvidence = await getFullSystemAuditTool(auditDateRange);
      evidences.push(fullAuditEvidence);
      break;
    }

    case 'CREDIT_SALES_QUERY': {
      const creditSalesEvidence = await getCreditSalesSummaryTool(dateRange, isVerification);
      evidences.push(creditSalesEvidence);
      break;
    }

    case 'WITHDRAWALS_AND_ADJUSTMENTS_QUERY': {
      const withdrawalsEvidence = await getWithdrawalsAndAdjustmentsTool(nluResult, memoryContext || {});
      evidences.push(withdrawalsEvidence);
      break;
    }

    case 'SYSTEM_DICTIONARY_EXPLANATION':
    case 'ACCOUNTING_CONCEPT':
    case 'SYSTEM_SECTIONS_GUIDE':
    case 'SYSTEM_INFO': {
      const dictionaryEvidence = await getSystemDictionaryExplanationTool(nluResult, memoryContext || {});
      evidences.push(dictionaryEvidence);
      break;
    }

    case 'STORE_HEALTH_DIAGNOSTIC': {
      const healthEvidence = await getStoreHealthDiagnosticTool();
      evidences.push(healthEvidence);
      break;
    }

    case 'PERFORMANCE_COMPARISON': {
      const perfEvidence = await getPerformanceComparisonTool(dateRange);
      evidences.push(perfEvidence);
      break;
    }

    case 'TOP_REVENUE_PRODUCT_QUERY': {
      const topRevenueEvidence = await getTopRevenueOrProfitProductsTool(dateRange, 5);
      evidences.push(topRevenueEvidence);
      break;
    }

    case 'TOP_DEBTORS_QUERY': {
      const topDebtorsEvidence = await getTopDebtorsTool(5);
      evidences.push(topDebtorsEvidence);
      break;
    }

    case 'DISAMBIGUATION_REQUIRED': {
      if (targetName) {
        const ambigEvidence = await checkNameAmbiguityTool(targetName);
        evidences.push(ambigEvidence);
      }
      break;
    }

    case 'LARGEST_SALE_QUERY': {
      const explicitRange = dateRangeEntity ? (dateRangeEntity.value as string) : 'ALL';
      const largestSaleEvidence = await getLargestSaleTool(explicitRange);
      evidences.push(largestSaleEvidence);
      break;
    }

    case 'DRILLDOWN_EXPLANATION': {
      const drilldownEvidence = await getDrilldownExplanationTool({
        invoiceId,
        targetName,
        dateRange,
        lastTopic: memoryContext?.activeEntities?.lastTopic,
        lastIntent: memoryContext?.activeEntities?.lastIntent,
        lastEvidenceData: memoryContext?.activeEntities?.lastEvidenceData,
        explanationContext: memoryContext?.activeEntities?.explanationContext,
      });
      evidences.push(drilldownEvidence);
      break;
    }

    case 'COMPARISON':
    case 'SALES_COMPARISON': {
      const comparisonEvidence = await getSalesComparisonTool(dateRange);
      evidences.push(comparisonEvidence);
      break;
    }

    case 'GROWTH_ADVICE': {
      const growthEvidence = await getGrowthStrategyTool();
      evidences.push(growthEvidence);
      break;
    }

    case 'DIAGNOSTIC_ANALYSIS': {
      const diagnosticEvidence = await getDiagnosticAnalysisTool();
      evidences.push(diagnosticEvidence);
      break;
    }

    case 'SALES_QUERY':
    case 'SALES_SUMMARY':
    case 'SALES_BY_PERIOD':
    case 'SALES_BY_CUSTOMER':
    case 'SALES_ANALYSIS':
    case 'TREND_ANALYSIS': {
      const salesEvidence = await getSalesSummaryTool(dateRange, targetName, isVerification);
      evidences.push(salesEvidence);
      break;
    }

    case 'FORECAST': {
      const forecastEvidence = await getForecastTool();
      evidences.push(forecastEvidence);
      break;
    }

    case 'SALES_BY_PRODUCT': {
      const productSalesEvidence = await getSalesByProductTool(targetName, dateRange, isVerification);
      evidences.push(productSalesEvidence);
      break;
    }

    case 'SUPPLIER_PAYMENTS': {
      const supplierPaymentsEvidence = await getSupplierPaymentsByDateTool(nluResult, memoryContext || {});
      evidences.push(supplierPaymentsEvidence);
      break;
    }

    case 'CUSTOMER_PAYMENTS': {
      const customerPaymentsEvidence = await getCustomerPaymentsTool(targetName, dateRange, isVerification);
      evidences.push(customerPaymentsEvidence);
      break;
    }

    case 'CUSTOMER_COLLECTION_RATE': {
      const collectionRateEvidence = await getCustomerCollectionRateTool(dateRange);
      evidences.push(collectionRateEvidence);
      break;
    }

    case 'CUSTOMER_STATEMENT': {
      const statementEvidence = await getCustomerStatementTool(targetName, dateRange);
      evidences.push(statementEvidence);
      break;
    }

    case 'SUPPLIER_STATEMENT': {
      const supplierStatementEvidence = await getSupplierStatementTool(targetName, dateRange);
      evidences.push(supplierStatementEvidence);
      break;
    }

    case 'PURCHASES_SUMMARY': {
      const purchasesEvidence = await getPurchasesSummaryTool(targetName, dateRange);
      evidences.push(purchasesEvidence);
      break;
    }

    case 'DEBT_SUPPLIER_QUERY':
    case 'SUPPLIER_BALANCE':
    case 'SUPPLIER_SEARCH': {
      const supplierEvidence = await getSupplierDebtsTool(targetName, dateRange);
      evidences.push(supplierEvidence);
      break;
    }

    case 'SUPPLIER_PAYMENT_DUE': {
      const supplierDueEvidence = await getSuppliersDueTool();
      evidences.push(supplierDueEvidence);
      break;
    }

    case 'LOW_STOCK':
    case 'SLOW_MOVING_STOCK': {
      const lowStockEvidence = await getLowStockReportTool();
      evidences.push(lowStockEvidence);
      break;
    }

    case 'EXPIRED_PRODUCTS':
    case 'EXPIRING_PRODUCTS': {
      const expiredEvidence = await getExpiredAndExpiringReportTool();
      evidences.push(expiredEvidence);
      break;
    }

    case 'INVENTORY_VALUATION': {
      const valuationEvidence = await getInventoryValuationTool();
      evidences.push(valuationEvidence);
      break;
    }

    case 'INVENTORY_QUERY':
    case 'INVENTORY_STATUS':
    case 'PRODUCT_SEARCH': {
      const inventoryEvidence = await getInventoryStatusTool(targetName);
      evidences.push(inventoryEvidence);
      break;
    }

    case 'UNPAID_INVOICES': {
      const unpaidEvidence = await getUnpaidInvoicesTool();
      evidences.push(unpaidEvidence);
      break;
    }

    case 'INVOICE_SEARCH':
    case 'INVOICE_DETAILS': {
      const invoiceEvidence = await getInvoiceSearchTool(invoiceId, targetName);
      evidences.push(invoiceEvidence);
      break;
    }

    case 'DEBT_CUSTOMER_QUERY':
    case 'CUSTOMER_BALANCE':
    case 'CUSTOMER_SEARCH':
    case 'DEBT_ANALYSIS':
    case 'CUSTOMER_CREDIT_LIMIT': {
      const debtEvidence = await getCustomerDebtsTool(targetName, dateRange);
      evidences.push(debtEvidence);
      break;
    }

    case 'PROFIT_QUERY':
    case 'PROFIT_SUMMARY':
    case 'PROFIT_ANALYSIS':
    case 'PROFIT_MARGIN_RANKING': {
      const rawQuery = (nluResult as any).rawQuery || '';
      const profitEvidence = await getProfitSummaryTool(dateRange, rawQuery);
      evidences.push(profitEvidence);
      break;
    }

    case 'CASH_FLOW': {
      const cashFlowEvidence = await getCashFlowStatementTool(dateRange);
      evidences.push(cashFlowEvidence);
      break;
    }

    case 'EXPENSE_CASH_QUERY':
    case 'EXPENSES_SUMMARY':
    case 'CASH_BALANCE': {
      const cashEvidence = await getCashSummaryTool(dateRange, isVerification);
      evidences.push(cashEvidence);
      break;
    }

    case 'ANOMALY_DETECTION': {
      const anomalyEvidence = await getAnomalyDetectionTool(dateRange, isVerification);
      evidences.push(anomalyEvidence);
      break;
    }

    case 'NOTE_REMINDER_QUERY': {
      const notesEvidence = await getNotesAndRemindersTool();
      evidences.push(notesEvidence);
      break;
    }

    case 'FINANCIAL_REPORT': {
      const reportEvidence = await getFinancialReportTool(dateRange);
      evidences.push(reportEvidence);
      break;
    }

    case 'TAX_ZATCA_QUERY': {
      const taxEvidence = await getTaxReportTool(dateRange);
      evidences.push(taxEvidence);
      break;
    }

    case 'TOP_SELLING_PRODUCTS': {
      const topProductsEvidence = await getTopSellingProductsTool(5);
      evidences.push(topProductsEvidence);
      break;
    }

    case 'POS_SHIFT_SUMMARY': {
      const shiftEvidence = await getPOSShiftSummaryTool(dateRange);
      evidences.push(shiftEvidence);
      break;
    }

    default: {
      const overviewSales = await getSalesSummaryTool('TODAY');
      evidences.push(overviewSales);
      break;
    }
  }

  return evidences;
}

export * from './accountingTools';

