import { AgentResponse, UserQuery } from '../types';

export interface SecurityPolicy {
  allowWriteOperations: boolean;
  maxQueryLength: number;
  rateLimitPerMinute: number;
}

const defaultPolicy: SecurityPolicy = {
  allowWriteOperations: false, // Strict Read-Only guard for AI Assistant
  maxQueryLength: 500,
  rateLimitPerMinute: 60,
};

/**
 * Sliding window rate limiting timestamps.
 */
const requestTimestamps: number[] = [];

/**
 * Regex patterns to detect prompt injection attempts.
 */
const INJECTION_PATTERNS = [
  /system\s+instruction/i,
  /ignore\s+previous/i,
  /forget\s+all\s+rules/i,
  /تجاهل\s+(التعليمات|القواعد|الأوامر)/i,
  /امسح\s+الذاكرة/i,
  /تعليمات\s+النظام/i,
  /اظهر\s+التوجيهات/i,
  /reveal\s+prompt/i,
  /u\s+are\s+now/i,
  /أنت\s+الآن/i,
  /كتابة\s+كود\s+جديد/i,
];

/**
 * Strips HTML tags specifically while preserving standard mathematical brackets/operators.
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

/**
 * Strips active dangerous attributes (like onload, onerror, javascript:) to thwart XSS vector injections.
 */
function stripDangerousAttributes(text: string): string {
  return text
    .replace(/\bon[a-zA-Z]+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon[a-zA-Z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Checks if query contains prompt injection keywords or attempts.
 */
function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Checks sliding window rate limit.
 */
function checkRateLimit(limit: number): boolean {
  const now = Date.now();
  // Filter out logs older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= limit) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

/**
 * In-memory query cache for instant responses on identical queries within a session.
 */
const queryCache = new Map<string, { response: AgentResponse; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

/**
 * Checks security constraints and sanitized inputs before processing query.
 */
export function validateQuerySecurity(
  rawQuery: string,
  policy: SecurityPolicy = defaultPolicy
): { isValid: boolean; sanitizedText: string; errorReason?: string } {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { isValid: false, sanitizedText: '', errorReason: 'السؤال فارغ' };
  }

  const trimmed = rawQuery.trim();
  if (trimmed.length === 0) {
    return { isValid: false, sanitizedText: '', errorReason: 'السؤال فارغ' };
  }

  // 1. Check Rate Limit
  if (!checkRateLimit(policy.rateLimitPerMinute)) {
    return {
      isValid: false,
      sanitizedText: trimmed,
      errorReason: '⚠️ لقد تجاوزت حد الطلبات المسموح به في الدقيقة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    };
  }

  // 2. Check Max Length
  if (trimmed.length > policy.maxQueryLength) {
    return {
      isValid: false,
      sanitizedText: trimmed.slice(0, policy.maxQueryLength),
      errorReason: `تجاوز النص الحد الأقصى المسموح به (${policy.maxQueryLength} حرف)`,
    };
  }

  // 3. Prompt Injection Defense
  if (detectPromptInjection(trimmed)) {
    return {
      isValid: false,
      sanitizedText: trimmed,
      errorReason: '⚠️ تم اكتشاف محاولة تجاوز السياسات الأمنية للذكاء الاصطناعي. تم حظر الاستعلام لضمان حماية النظام والمستندات.',
    };
  }

  // 4. Sanitize Input against XSS and HTML injections
  let sanitizedText = stripHtmlTags(trimmed);
  sanitizedText = stripDangerousAttributes(sanitizedText);

  return { isValid: true, sanitizedText };
}

/**
 * Gets cached response if valid.
 */
export function getCachedQueryResponse(queryKey: string): AgentResponse | null {
  const cached = queryCache.get(queryKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }
  if (cached) {
    queryCache.delete(queryKey);
  }
  return null;
}

/**
 * Sets query response into memory cache.
 */
export function setCachedQueryResponse(queryKey: string, response: AgentResponse): void {
  queryCache.set(queryKey, {
    response,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clears the query cache.
 */
export function clearQueryCache(): void {
  queryCache.clear();
}
