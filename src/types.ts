export interface Env {
  LOG_STORAGE: R2Bucket
  AI: any
  AUTH_USERNAME: string
  AUTH_PASSWORD: string
  DB?: D1Database
}

export interface CloudflareGatewayLog {
  datetime: string
  device_id?: string
  device_name?: string
  email: string
  source_ip: string
  destination_ip?: string
  url: string
  http_host?: string
  http_method: string
  http_status_code: number
  action: 'allow' | 'block' | 'isolate' | 'log'
  policy_name?: string
  policy_id?: string
  categories?: string[]
  client_request_bytes: number
  client_response_bytes: number
  user_agent: string
  matched_detections?: string[]
  dlp_profiles?: string[]
  is_isolated?: boolean
  untrusted_certificate?: boolean
  request_id?: string
}

export interface Anomaly {
  row_index: number
  rule: 'burst_rate' | 'auth_failure' | 'data_exfiltration' | 'suspicious_pattern' | 
        'dlp_violation' | 'threat_detection' | 'suspicious_category' | 'repeated_blocks' | 
        'excessive_download' | 'policy_violation'
  confidence: number
  explanation: string
  raw_log: any
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface AnalysisResult {
  jobId: string
  status: 'processing' | 'complete' | 'failed'
  totalLogs: number
  anomalies: Anomaly[]
  timeline?: string
  summary?: {
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
  }
}