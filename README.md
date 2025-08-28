# SOC Log Analyzer - Cloudflare Gateway Edition

A Security Operations Center (SOC) log analysis tool built on Cloudflare Workers that processes Cloudflare Gateway logs to detect security anomalies using deterministic algorithms and AI-powered timeline generation.

## 🎯 Key Features

- **Cloudflare Gateway Log Processing**: Native support for Cloudflare's security logs
- **Multi-Layer Anomaly Detection**:
  - DLP (Data Loss Prevention) violations
  - Threat/malware detection
  - Suspicious category access
  - Burst rate anomalies
  - Authentication failures
  - Data exfiltration attempts
- **AI-Enhanced Analysis**: Uses Workers AI for timeline generation and executive summaries
- **RESTful API**: Simple upload endpoint with basic authentication
- **Confidence Scoring**: Each anomaly includes confidence level and severity rating

## 🏗 Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client     │────▶│  Worker API     │────▶│  R2 Storage  │
│  (Browser)   │     │  (TypeScript)   │     │  (Log Files) │
└──────────────┘     └────────┬────────┘     └──────────────┘
                              │
                    ┌─────────▼────────┐
                    │   Processing     │
                    │  ├─ Parser       │
                    │  ├─ Detectors    │
                    │  └─ AI Summarizer│
                    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tenex-take-home

# Install dependencies
npm install

# Configure Cloudflare credentials
wrangler login

# Create R2 bucket
wrangler r2 bucket create soc-log-files

# Deploy to Cloudflare Workers
npm run deploy
```

### Local Development

```bash
# Run the Worker locally
npm run dev

# Test with sample logs
curl -X POST http://localhost:8787/api/upload \
  -u admin:devpassword \
  -F "file=@sample-logs/gateway-anomalous.json"
```

## 📊 Log Format

The analyzer accepts Cloudflare Gateway logs in JSON format:

```json
{
  "Datetime": "2024-01-15T10:00:00Z",
  "Email": "user@company.com",
  "SourceIP": "192.168.1.100",
  "URL": "https://example.com",
  "HTTPMethod": "GET",
  "HTTPStatusCode": 200,
  "Action": "allow",
  "Categories": ["Technology", "SaaS"],
  "ClientRequestBytes": 543,
  "ClientResponseBytes": 5432,
  "UserAgent": "Mozilla/5.0",
  "MatchedDetections": [],
  "DLPProfiles": []
}
```

## 🔍 Detection Algorithms

### 1. DLP Violations (Confidence: 100%)
Detects when sensitive data profiles are triggered:
- Credit card numbers
- Social Security Numbers
- API keys
- Confidential documents

### 2. Threat Detection (Confidence: 95%)
Identifies malware and security threats:
- Known malware signatures
- Command & Control communications
- Botnet activity
- Untrusted certificates

### 3. Suspicious Categories (Confidence: 70-100%)
Monitors access to risky website categories:
- Malware, Phishing, Spyware
- Newly Seen Domains
- Proxy/Anonymizer services
- P2P/Torrent sites

### 4. Burst Rate Detection (Z-Score Based)
Statistical analysis to detect abnormal request patterns:
- Calculates baseline request rate per user
- Identifies statistically significant deviations (z-score > 3)
- Helps detect automated attacks or compromised accounts

### 5. Authentication Failures
Tracks repeated authentication failures:
- 401/403 HTTP status codes
- Blocked actions
- Configurable threshold (default: 3 failures in 5 minutes)

### 6. Data Exfiltration Detection
Identifies unusual data transfers:
- Calculates 95th/99th percentile of normal transfers
- Flags transfers exceeding thresholds
- Special attention to file sharing sites

## 🤖 AI Integration

The system uses Cloudflare Workers AI for:

### Timeline Generation
- Groups anomalies by time periods
- Creates SOC analyst-friendly narrative
- Highlights critical events requiring immediate action

### Executive Summary
- Provides high-level security posture overview
- Summarizes key findings
- Recommends priority actions

**Important**: AI is used ONLY for explanation and summarization, NOT for detection. All anomaly detection uses deterministic algorithms to ensure consistency and explainability.

## 📡 API Endpoints

### POST /api/upload
Upload and analyze a log file.

```bash
curl -X POST https://your-worker.workers.dev/api/upload \
  -u admin:password \
  -F "file=@logs.json"
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "complete",
  "totalLogs": 100,
  "anomalies": [...],
  "timeline": "...",
  "summary": {
    "criticalCount": 2,
    "highCount": 5,
    "mediumCount": 10,
    "lowCount": 15
  }
}
```

### GET /api/jobs/:id
Retrieve analysis results for a specific job.

### GET /api/health
Health check endpoint.

## 🔒 Security

- **Authentication**: HTTP Basic Auth (configurable via environment variables)
- **File Size Limit**: 10MB for synchronous processing
- **Input Validation**: Strict log format validation
- **No Data Persistence**: Logs are processed in-memory (unless D1 is configured)

## 🧪 Testing

Sample log files are provided in the `sample-logs/` directory:

- `gateway-normal.json`: Baseline normal activity
- `gateway-anomalous.json`: Various security incidents
- `gateway-mixed.json`: Combination of normal and suspicious activity

```bash
# Test with normal logs
curl -X POST http://localhost:8787/api/upload \
  -u admin:devpassword \
  -F "file=@sample-logs/gateway-normal.json"

# Test with anomalous logs
curl -X POST http://localhost:8787/api/upload \
  -u admin:devpassword \
  -F "file=@sample-logs/gateway-anomalous.json"
```

## 🚀 Production Deployment

1. Set production secrets:
```bash
wrangler secret put AUTH_PASSWORD --env production
```

2. Deploy to production:
```bash
wrangler deploy --env production
```

3. Configure custom domain (optional):
```bash
wrangler domains add your-domain.com
```

## 📈 Performance Considerations

- **Synchronous Processing**: Files up to 10MB
- **Streaming**: Large files streamed directly to R2
- **Concurrency**: Workers can handle multiple requests simultaneously
- **Caching**: AI responses cached for 15 minutes
- **Rate Limiting**: Implement at Cloudflare edge if needed

## 🔧 Configuration

Environment variables (set in `wrangler.toml` or via secrets):

- `AUTH_USERNAME`: Basic auth username
- `AUTH_PASSWORD`: Basic auth password
- `LOG_STORAGE`: R2 bucket binding
- `AI`: Workers AI binding
- `DB`: Optional D1 database binding

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please ensure:
1. Code follows TypeScript best practices
2. All detectors include confidence scoring
3. AI is used only for summarization, not detection
4. Tests cover new detection rules

## 🎯 Why This Approach?

This implementation demonstrates:

1. **Cloudflare Platform Expertise**: Native integration with Gateway, Workers, R2, and AI
2. **Security Domain Knowledge**: Real-world SOC use cases and detection patterns
3. **Balanced AI Usage**: AI enhances but doesn't replace deterministic security logic
4. **Production Readiness**: Proper error handling, logging, and scalability considerations
5. **Clean Architecture**: Separation of concerns, modular design, TypeScript throughout