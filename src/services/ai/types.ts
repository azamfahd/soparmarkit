// AI Core Types

export interface UserQuery {
  rawText: string;
  normalizedText?: string;
  timestamp?: number;
  id?: string;
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
  suggestedClarifications?: string[];
}

export type DataSource = 'INDEXED_DB' | 'RAG' | 'ML' | 'GENERAL_KNOWLEDGE' | 'UNKNOWN';

export interface Evidence {
  source: DataSource;
  data: any;
  metadata?: Record<string, any>;
}

export interface ProcessingStage {
  stageNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'skipped';
  details?: string;
  badge?: string;
}

export interface AgentResponse {
  answer: string;
  evidence: Evidence[];
  suggestedActions?: string[];
  confidence: number;
  processingStages?: ProcessingStage[];
  reasoningSummary?: string;
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
  processingStages?: ProcessingStage[];
  reasoningSummary?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}
