# Hybrid AI Accounting System Architecture Specification

## 1. System Vision & Paradigm
The Advanced Hybrid AI Accounting Agent is an **Offline-First, Grounded, Multi-Layered AI Agent** designed specifically for Arabic accounting environments (Smart Grocery System / المحزن الذكي المحاسبي).

### Core Architectural Principles:
1. **System Database is the Absolute Source of Truth**: Financial numbers, balances, inventory levels, and debt records are derived ONLY from IndexedDB (`db.ts`) via deterministic Accounting Tools. The AI LLM never invents or guesses financial numbers.
2. **Knowledge Base / RAG is the Source of Company Policies**: Company rules, discount caps, return policies, and uploaded documents reside in the local Knowledge Base and are retrieved via Hybrid RAG (BM25 + TF-IDF + Metadata + Vector Embeddings).
3. **Statistical & ML Engine is the Source of Predictions**: Sales forecasts, anomaly detection, and product association matrices are computed by deterministic statistical engines (OLS Linear Regression, Exponential Smoothing, Co-occurrence Matrix).
4. **Offline-First Resilience**: All core capabilities (NLU, Intent Detection, Tool Execution, RAG Search, ML Forecasting, Memory, Feedback) run locally inside the PWA browser environment without requiring internet connectivity.
5. **Optional Gemini AI Provider**: Online Gemini API capabilities act as an optional enrichment layer (e.g., OCR processing or external summary synthesis) and never compromise private company data or offline availability.

---

## 2. High-Level Flow Diagram

```
                              ┌─────────────────────────┐
                              │    User Input Query     │
                              └────────────┬────────────┘
                                           │
                               ┌───────────▼───────────┐
                               │  Arabic Normalizer    │
                               │  & Typo Cleansing     │
                               └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │ Intent Classifier &   │
                               │ Entity Extractor      │
                               └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │  Multi-Turn Memory &  │
                               │  Context Resolver     │
                               └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │   AI Router Engine    │
                               └───────────┬───────────┘
                                           │
         ┌─────────────────────────────────┼────────────────────────────────┐
         │                                 │                                │
┌────────▼─────────┐             ┌─────────▼─────────┐             ┌────────▼─────────┐
│ Accounting Tools │             │ Hybrid RAG Engine │             │  ML / Analytics │
│ (Dexie IndexedDB)│             │ (Company Docs)    │             │  (OLS / Anomalies)│
└────────┬─────────┘             └─────────┬─────────┘             └────────┬─────────┘
         │                                 │                                │
         └─────────────────────────────────┼────────────────────────────────┘
                                           │
                               ┌───────────▼───────────┐
                               │   Evidence Assembler  │
                               │   & Grounding Guard   │
                               └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │ Answer Generator      │
                               │ (Local or Gemini)     │
                               └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │ User Feedback & Logs  │
                               └───────────────────────┘
```

---

## 3. Layer Breakdown

### Layer A: NLU & Intent Understanding (`/src/services/ai/nlu/`)
- **Arabic Normalizer**: Strips diacritics, unifies alef (`أ`/`إ`/`آ` -> `ا`), marboota (`ة` -> `ه`), and removes stop words while preserving domain keywords.
- **Intent Detector**: Evaluates inputs against weighted regular expression rules, synonym expansion dictionaries, and vector density scoring.
- **Entity Extractor**: Extracts names, dates/periods, amounts, product names, and categories with strict generic stop-word filtering.

### Layer B: System Tools & DB Execution (`/src/services/ai/tools/`)
- Pure read-only queries against Dexie IndexedDB v13.
- Isolated tools for Customer Debts, Supplier Debts, Period Sales, Profitability, Inventory Status, Cash/Expenses, and Statements.

### Layer C: Hybrid RAG Knowledge Engine (`/src/services/ai/rag/`)
- Supports local ingestion of PDF, DOCX, TXT, CSV, JSON, and Markdown files.
- Chunking pipeline with overlapping windows and metadata enrichment.
- Hybrid search combining BM25 probabilistic term frequency with TF-IDF cosine similarity, tag boosting, and exact metadata filtering.

### Layer D: Statistical & Machine Learning Analytics (`/src/services/ai/ml/`)
- OLS Linear Regression for sales time-series forecasting.
- Exponential Smoothing for short-term demand prediction.
- Co-occurrence Market Basket Analysis for cross-selling recommendations.
- Z-score and multi-factor threshold rules for transaction anomaly detection.

### Layer E: Security & Grounding Guardrails (`/src/services/ai/evaluation/`)
- Enforces strict read-only execution mode (`allowWriteOperations: false`).
- Prevents prompt injection by isolating retrieved document text into user-data scopes.
- Returns explicit "data not found" notices rather than generating fictitious numbers.

---

## 4. Provider Abstraction Architecture
The system supports three execution modes:
1. `LOCAL`: Runs 100% locally in browser using deterministic tools, rule engines, and offline template generators.
2. `ONLINE`: Directs queries to Gemini API via backend proxy when internet is active and user permits.
3. `AUTO` (Default): Uses Local First; enriches responses via Gemini API when available, smoothly falling back to Local output if offline.
