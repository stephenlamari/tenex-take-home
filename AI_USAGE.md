# AI Usage Documentation

## Overview
This SOC Log Analyzer application uses AI/LLMs in specific areas to enhance threat analysis and provide human-readable insights from security logs.

## AI Model Used
- **Cloudflare Workers AI**: `@cf/google/gemma-7b-it-lora`
- A lightweight, instruction-tuned language model optimized for edge computing

## Where AI is Used

### 1. Timeline Generation (`src/ai-summarizer.ts:3-30`)
**Purpose**: Creates a chronological narrative of security events for SOC analysts

**Input**: 
- Detected anomalies grouped by time
- Critical and high-priority events
- Event categories and rules

**Output**: 
- Markdown-formatted timeline with:
  - Critical events requiring immediate action
  - Hourly event summaries
  - Recommended actions for SOC team

**Prompt Engineering**:
```typescript
// Lines 57-78 in ai-summarizer.ts
- Instructs AI to act as a SOC analyst
- Requests concise timeline summary
- Focuses on actionable intelligence
- Limits response to 400 words
```

### 2. Executive Summary Generation (`src/ai-summarizer.ts:123-161`)
**Purpose**: Provides high-level overview for management/stakeholders

**Input**:
- Anomaly statistics (total, by severity)
- Top triggered rules
- Affected users list

**Output**:
- 3-4 bullet points summarizing:
  - Overall security posture
  - Most critical findings
  - Recommended actions

**Prompt Engineering**:
```typescript
// Lines 139-147 in ai-summarizer.ts
- Requests brief executive summary
- Formats as concise bullet points
- Limits to 100 words total
```

## Fallback Mechanisms

Both AI functions include deterministic fallback functions that activate if:
- AI model fails to respond
- Response is empty/invalid
- API errors occur

### Timeline Fallback (`generateFallbackTimeline`)
- Uses template-based formatting
- Preserves all critical information
- Maintains consistent structure

### Summary Fallback (`generateFallbackSummary`)
- Provides statistical overview
- Highlights critical counts
- Lists top security concerns

## Why AI is Used

1. **Human Readability**: Transforms raw anomaly data into narrative form that's easier for SOC analysts to understand and act upon

2. **Pattern Recognition**: AI can identify relationships between events that might not be obvious from raw data

3. **Prioritization**: Helps analysts focus on the most critical issues by summarizing and highlighting key events

4. **Time Efficiency**: Automatically generates reports that would take analysts significant time to write manually

## Non-AI Components

The following are **NOT** using AI and rely on deterministic algorithms:

1. **Anomaly Detection** (`src/detectors.ts`)
   - Rule-based detection algorithms
   - Statistical analysis (z-scores, percentiles)
   - Pattern matching for known threats

2. **Log Parsing** (`src/parser.ts`)
   - Deterministic JSON/text parsing
   - Field mapping and validation

3. **Data Processing** (`src/processor.ts`)
   - File handling and storage
   - Result aggregation
   - Statistics calculation

## Security Considerations

- AI is used only for summarization, not for making security decisions
- All anomaly detection is deterministic for consistency
- AI responses have token limits to prevent excessive resource usage
- Fallback mechanisms ensure system functionality even if AI fails

## Cost and Performance

- Uses Cloudflare's edge AI for low latency
- Token limits: 500 for timeline, 150 for summary
- Temperature: 0.3 (favors consistency over creativity)
- Processes on-demand only when logs are analyzed