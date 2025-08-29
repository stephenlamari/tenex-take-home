# SOC Log Analyzer

A full-stack cybersecurity application for analyzing Cloudflare Gateway logs, detecting anomalies, and providing AI-powered insights for SOC analysts.

## 🚀 Live Demo

- **Application**: https://soc-log-analyzer-ui.pages.dev
- **Test Credentials**: 
  - Username: `soc_admin`
  - Password: Contact for access
- **Sample Data**: Available on the upload page

## 📋 Features

### Core Functionality
- **Secure Authentication**: Basic auth protection for all API endpoints
- **File Upload**: Support for JSON, TXT, and LOG files (up to 10MB)
- **Log Parsing**: Processes Cloudflare Gateway logs in NDJSON format
- **Real-time Analysis**: Immediate processing and visualization of results

### Anomaly Detection
- **DLP Violations**: Detects data loss prevention policy violations
- **Threat Detection**: Identifies malware, trojans, ransomware
- **Suspicious Categories**: Flags access to malicious/suspicious domains
- **Burst Rate Analysis**: Detects unusual request patterns
- **Excessive Downloads**: Identifies potential data exfiltration
- **Repeated Blocks**: Tracks users with multiple security violations

### AI-Powered Features
- **Timeline Generation**: Chronological narrative of security events
- **Executive Summary**: High-level overview for stakeholders
- **Smart Prioritization**: AI helps identify critical patterns
- See [AI_USAGE.md](AI_USAGE.md) for detailed documentation

### Visualization
- **Statistics Dashboard**: Overview of logs, anomalies, and actions
- **Filtered Tables**: View anomalies by severity level
- **Interactive Timeline**: AI-generated security event narrative
- **Confidence Scores**: Each anomaly includes detection confidence

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                      │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js Frontend (Cloudflare Pages)           │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │ │
│  │  │  Upload  │  │ Results  │  │   AI Timeline    │      │ │
│  │  │   Page   │  │   View   │  │    Component     │      │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
│                              ↓ HTTPS/API                    │
└─────────────────────────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers Edge                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Backend                         │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │ │
│  │  │   Auth   │→ │   Log    │→ │    Anomaly       │      │ │
│  │  │  Handler │  │  Parser  │  │   Detectors      │      │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘      │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────┐      │ │
│  │  │            AI Summarizer                     │      │ │
│  │  └──────────────────────────────────────────────┘      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
│                              ↓                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Cloudflare Services                   │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │    R2    │  │  Workers AI  │  │     KV       │      │ │
│  │  │ Storage  │  │   (Gemma 7b) │  │   (Cache)    │      │ │
│  │  └──────────┘  └──────────────┘  └──────────────┘      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.5 with TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages

### Backend
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Storage**: Cloudflare R2
- **AI**: Cloudflare Workers AI

## 🏃‍♂️ Running Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Cloudflare account (free tier works)

### Backend Setup / If you want to deploy this yourself

1. Clone the repository:
```bash
git clone git@github.com:stephenlamari/tenex-take-home.git
cd tenex-take-home
```

2. Install dependencies:
```bash
npm install
```

3. Configure Cloudflare:
```bash
npx wrangler login
```

4. Create R2 bucket:
```bash
npx wrangler r2 bucket create soc-log-files
```

5. Update `wrangler.toml` with your settings:
```toml
[env.development.vars]
AUTH_USERNAME = "admin"
AUTH_PASSWORD = "your-password"
```

6. Run the backend:
```bash
npm run dev
```

Backend will be available at `http://localhost:8787`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend/soc-log-analyzer-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

4. Run the frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🚢 Deployment

### Deploy Backend to Cloudflare Workers

1. Configure production settings in `wrangler.toml`:
```toml
[env.production.vars]
AUTH_USERNAME = "your-username"
AUTH_PASSWORD = deploy as cloudflare secret
```

2. Deploy:
```bash
npx wrangler deploy --env production
```

### Deploy Frontend to Cloudflare Pages

1. Build the frontend:
```bash
cd frontend/soc-log-analyzer-ui
# Ensure the production API URL is set for the build
# Next.js will read .env.production (and ignore .env.development.local)
npm run build
```

2. Deploy to Pages:
```bash
npx wrangler pages deploy out --project-name=soc-log-analyzer-ui
```

Note:
- Do not keep a `.env.local` with development values when producing a production build — Next.js loads `.env.local` for all environments and it will override `.env.production`. This repo uses `.env.development.local` for local dev instead.
- The frontend reads `NEXT_PUBLIC_API_URL` at build time. For static exports (Pages), set this before running `next build` (or configure it in your CI build step). For Cloudflare Pages’ Git integration, set the variable under Pages → Settings → Environment Variables (Production) and let Cloudflare build the site.

## 📊 Log Format

The application expects Cloudflare Gateway logs in NDJSON format:

```json
{"Datetime":"2024-01-15T10:00:00Z","Email":"user@company.com","SourceIP":"192.168.1.150","URL":"https://example.com","Action":"block","Categories":["Malware"],"MatchedDetections":["trojan.generic"]}
```

Required fields:
- `Datetime`: ISO 8601 timestamp
- `Email`: User identifier
- `SourceIP`: Client IP address
- `URL`: Requested URL
- `Action`: allow/block/isolate

Optional fields for enhanced detection:
- `Categories`: Array of URL categories
- `MatchedDetections`: Security threats detected
- `DLPProfiles`: Data loss prevention profiles triggered
- `HTTPStatusCode`: Response status
- `ClientRequestBytes`/`ClientResponseBytes`: Data transfer sizes

## 🧪 Testing

Use the provided sample file `sample-logs/gateway-anomalous.json` which contains:
- DLP violations
- Malware detections
- Suspicious category accesses
- Various security events

Available on the upload page or directly at:
```bash
curl -O https://cc16971f.soc-log-analyzer-ui.pages.dev/sample-gateway-logs.json
```

## 📁 Project Structure

```
tenex-take-home/
├── src/                    # Backend source
│   ├── index.ts           # API routes
│   ├── processor.ts       # Log processing
│   ├── detectors.ts       # Anomaly detection
│   ├── ai-summarizer.ts   # AI integration
│   └── types.ts           # TypeScript types
├── frontend/
│   └── soc-log-analyzer-ui/
│       ├── app/           # Next.js pages
│       ├── components/    # React components
│       └── lib/           # Utilities
├── sample-logs/           # Test data
├── wrangler.toml         # Cloudflare config
└── AI_USAGE.md           # AI documentation
```

## 🔒 Security Considerations

- All API endpoints require authentication
- File size limited to 10MB
- Input validation on all user data
- CORS configured for production domain
- Sensitive data never logged
- AI used only for summarization, not security decisions

## 📝 License

MIT
