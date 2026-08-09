import { NLUResult, Evidence } from '../types';
import {
  getSalesSummaryTool,
  getProfitSummaryTool,
  getCustomerDebtsTool,
  getCustomerStatementTool,
  getSupplierDebtsTool,
  getSupplierStatementTool,
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
} from './accountingTools';

export async function executeTools(nluResult: NLUResult): Promise<Evidence[]> {
  const { intent, entities } = nluResult;
  const evidences: Evidence[] = [];

  // Extract common parameters from entities
  const dateRangeEntity = entities.find(e => e.type === 'DATE_RANGE');
  const dateRange = dateRangeEntity ? (dateRangeEntity.value as string) : 'TODAY';

  const targetNameEntity = entities.find(e => e.type === 'TARGET_NAME');
  const targetName = targetNameEntity ? targetNameEntity.value : undefined;

  const invoiceIdEntity = entities.find(e => e.type === 'INVOICE_ID');
  const invoiceId = invoiceIdEntity ? invoiceIdEntity.value : undefined;

  switch (intent.name) {
    case 'SALES_QUERY':
    case 'SALES_SUMMARY':
    case 'SALES_BY_PERIOD':
    case 'SALES_BY_CUSTOMER':
    case 'SALES_ANALYSIS':
    case 'COMPARISON':
    case 'TREND_ANALYSIS': {
      const salesEvidence = await getSalesSummaryTool(dateRange);
      evidences.push(salesEvidence);
      break;
    }

    case 'FORECAST': {
      const forecastEvidence = await getForecastTool();
      evidences.push(forecastEvidence);
      break;
    }

    case 'SALES_BY_PRODUCT': {
      const productSalesEvidence = await getSalesByProductTool(targetName);
      evidences.push(productSalesEvidence);
      break;
    }

    case 'CUSTOMER_STATEMENT': {
      const statementEvidence = await getCustomerStatementTool(targetName);
      evidences.push(statementEvidence);
      break;
    }

    case 'SUPPLIER_STATEMENT': {
      const supplierStatementEvidence = await getSupplierStatementTool(targetName);
      evidences.push(supplierStatementEvidence);
      break;
    }

    case 'DEBT_SUPPLIER_QUERY':
    case 'SUPPLIER_BALANCE':
    case 'SUPPLIER_SEARCH':
    case 'PURCHASES_SUMMARY': {
      const supplierEvidence = await getSupplierDebtsTool(targetName);
      evidences.push(supplierEvidence);
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

    case 'INVENTORY_QUERY':
    case 'INVENTORY_STATUS':
    case 'PRODUCT_SEARCH': {
      const inventoryEvidence = await getInventoryStatusTool(targetName);
      evidences.push(inventoryEvidence);
      break;
    }

    case 'INVOICE_SEARCH':
    case 'INVOICE_DETAILS':
    case 'UNPAID_INVOICES': {
      const invoiceEvidence = await getInvoiceSearchTool(invoiceId, targetName);
      evidences.push(invoiceEvidence);
      break;
    }

    case 'DEBT_CUSTOMER_QUERY':
    case 'CUSTOMER_BALANCE':
    case 'CUSTOMER_SEARCH':
    case 'DEBT_ANALYSIS':
    case 'CUSTOMER_CREDIT_LIMIT': {
      const debtEvidence = await getCustomerDebtsTool(targetName);
      evidences.push(debtEvidence);
      break;
    }

    case 'PROFIT_QUERY':
    case 'PROFIT_SUMMARY':
    case 'PROFIT_ANALYSIS':
    case 'PROFIT_MARGIN_RANKING': {
      const profitEvidence = await getProfitSummaryTool(dateRange);
      evidences.push(profitEvidence);
      break;
    }

    case 'EXPENSE_CASH_QUERY':
    case 'EXPENSES_SUMMARY':
    case 'CASH_BALANCE':
    case 'CASH_FLOW': {
      const cashEvidence = await getCashSummaryTool();
      evidences.push(cashEvidence);
      break;
    }

    case 'ANOMALY_DETECTION': {
      const anomalyEvidence = await getAnomalyDetectionTool();
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

    case 'SUPPLIER_PAYMENT_DUE': {
      const supplierDueEvidence = await getSupplierDebtsTool(targetName);
      evidences.push(supplierDueEvidence);
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
