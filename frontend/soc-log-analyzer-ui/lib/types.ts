export type GatewayLog = {
  timestamp: string
  sourceIp: string
  identityEmail?: string
  deviceName?: string
  host: string
  url: string
  method: string
  status: number
  action: string
  bytesIn?: number
  bytesOut?: number
  userAgent?: string
  policyName?: string
}

export type Anomaly = {
  row_index: number
  rule: string
  confidence: number
  explanation: string
  raw_log: GatewayLog
}

export type Analysis = {
  anomalies: Anomaly[]
  timeline: string
  totals: {
    rows: number
    byAction: Record<string, number>
    byStatus: Record<string, number>
  }
}

export type UploadResponse =
  | { jobId: string; status: 'complete'; analysis: Analysis }
  | { jobId: string; status: 'processing' }

export type JobResponse = {
  jobId: string
  status: 'complete' | 'processing'
  analysis?: Analysis
}

export type RowsResponse = {
  rows: GatewayLog[]
  total: number
}