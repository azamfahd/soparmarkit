// AI Core Types

export interface UserQuery {
  rawText: string;
  normalizedText: string;
  timestamp: number;
  context?: {
    activeCustomer?: string;
    activeSupplier?: string;
    lastTargetName?: string;
    lastIntent?: string;
  };
}

export interface Intent {
  name: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
}

export interface NLUResult {
  intent: Intent;
  entities: Entity[];
  isClarificationNeeded: boolean;
  clarificationMessage?: string;
}

export type DataSource = 'INDEXED_DB' | 'RAG' | 'ML' | 'GENERAL_KNOWLEDGE' | 'UNKNOWN';

export interface Evidence {
  source: DataSource;
  data: any;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  answer: string;
  evidence: Evidence[];
  suggestedActions?: string[];
  confidence: number;
  metadata?: {
    routeType: 'ACCOUNTING_DB' | 'KNOWLEDGE_RAG' | 'STATISTICAL_ML' | 'HYBRID' | 'CLARIFICATION' | 'FALLBACK';
    executionTimeMs: number;
    intentName: string;
    confidence: number;
    fallbackUsed?: boolean;
    error?: string;
  };
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: string;
  evidence?: Evidence[];
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}
