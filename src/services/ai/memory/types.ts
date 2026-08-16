import { AIMessageRecord, AIConversationRecord } from '../../../db';
import { Entity } from '../types';

export interface ActiveEntityState {
  targetName?: string;
  targetType?: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'INVOICE' | 'EXPENSE' | 'UNKNOWN';
  dateRange?: string;
  productName?: string;
  invoiceId?: string;
  expenseType?: string;
  lastIntent?: string;
  lastTopic?: 'DEBT' | 'SALES' | 'PROFIT' | 'INVENTORY' | 'SUPPLIER' | 'INVOICE' | 'EXPENSE' | 'FINANCIAL_REPORT' | 'LARGEST_SALE' | 'GENERAL';
  lastEvidenceData?: any;
  lastToolName?: string;
  lastUserQuery?: string;
  lastAssistantAnswer?: string;
  lastInvoices?: any[];
  lastProducts?: any[];
  lastLargestSale?: any;
  explanationContext?: string;
  updatedAt: number;
}

export interface ConversationSummary {
  conversationId: string;
  summaryText: string;
  keyFacts: string[];
  lastUpdated: number;
}

export interface MemoryContext {
  conversationId: string;
  recentMessages: AIMessageRecord[];
  activeEntities: ActiveEntityState;
  summary?: ConversationSummary;
  isFollowUp: boolean;
  inheritedEntities: Entity[];
}

export interface ConversationSession {
  id: string;
  title: string;
  messageCount: number;
  lastMessageSnippet?: string;
  createdAt: number;
  updatedAt: number;
}
