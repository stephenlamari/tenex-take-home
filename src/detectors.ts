import { CloudflareGatewayLog, Anomaly } from './types'

export function detectAllAnomalies(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  anomalies.push(...detectDLPViolations(logs))
  anomalies.push(...detectThreatDetections(logs))
  anomalies.push(...detectSuspiciousCategories(logs))
  anomalies.push(...detectRepeatedBlocks(logs))
  anomalies.push(...detectExcessiveDownloads(logs))
  anomalies.push(...detectBurstRate(logs))
  anomalies.push(...detectAuthFailures(logs))
  
  return anomalies.sort((a, b) => b.confidence - a.confidence)
}

export function detectDLPViolations(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  logs.forEach((log, index) => {
    if (log.dlp_profiles && log.dlp_profiles.length > 0) {
      anomalies.push({
        row_index: index,
        rule: 'dlp_violation',
        confidence: 1.0,
        severity: 'critical',
        explanation: `DLP violation detected: ${log.dlp_profiles.join(', ')} - User: ${log.email} to ${log.url}`,
        raw_log: log
      })
    }
  })
  
  return anomalies
}

export function detectThreatDetections(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  logs.forEach((log, index) => {
    if (log.matched_detections && log.matched_detections.length > 0) {
      anomalies.push({
        row_index: index,
        rule: 'threat_detection',
        confidence: 0.95,
        severity: 'critical',
        explanation: `Threat detected: ${log.matched_detections.join(', ')} from ${log.source_ip} (${log.email})`,
        raw_log: log
      })
    }
  })
  
  return anomalies
}

export function detectSuspiciousCategories(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  const suspiciousCategories = new Set([
    'Malware', 'Phishing', 'Spyware', 'Botnets', 'Spam',
    'Newly Seen Domains', 'Parked Domains', 'Command and Control',
    'Cryptomining', 'Anonymizer', 'Proxy', 'VPN', 
    'DNS Tunneling', 'Remote Access', 'P2P', 'Torrent'
  ])
  
  logs.forEach((log, index) => {
    const suspicious = (log.categories || []).filter(cat => 
      suspiciousCategories.has(cat)
    )
    
    if (suspicious.length > 0) {
      const confidence = Math.min(1, 0.7 + (0.1 * suspicious.length))
      const severity = confidence > 0.9 ? 'high' : confidence > 0.8 ? 'medium' : 'low'
      
      anomalies.push({
        row_index: index,
        rule: 'suspicious_category',
        confidence,
        severity,
        explanation: `Access to suspicious category: ${suspicious.join(', ')} by ${log.email}`,
        raw_log: log
      })
    }
  })
  
  return anomalies
}

export function detectRepeatedBlocks(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const blocksByUser = new Map<string, { indices: number[], timestamps: number[] }>()
  
  logs.forEach((log, index) => {
    if (log.action === 'block') {
      if (!blocksByUser.has(log.email)) {
        blocksByUser.set(log.email, { indices: [], timestamps: [] })
      }
      const userBlocks = blocksByUser.get(log.email)!
      userBlocks.indices.push(index)
      userBlocks.timestamps.push(new Date(log.datetime).getTime())
    }
  })
  
  blocksByUser.forEach((blocks, user) => {
    const fiveMinutes = 5 * 60 * 1000
    let maxBlocksInWindow = 0
    let windowStart = 0
    
    for (let i = 0; i < blocks.timestamps.length; i++) {
      let count = 1
      for (let j = i + 1; j < blocks.timestamps.length; j++) {
        if (blocks.timestamps[j] - blocks.timestamps[i] <= fiveMinutes) {
          count++
        } else {
          break
        }
      }
      if (count > maxBlocksInWindow) {
        maxBlocksInWindow = count
        windowStart = i
      }
    }
    
    if (maxBlocksInWindow >= 5) {
      const confidence = Math.min(1, maxBlocksInWindow / 10)
      const severity = maxBlocksInWindow >= 10 ? 'high' : 'medium'
      
      anomalies.push({
        row_index: blocks.indices[windowStart],
        rule: 'repeated_blocks',
        confidence,
        severity,
        explanation: `User ${user} triggered ${maxBlocksInWindow} blocks in 5 minutes - possible compromise or policy violation`,
        raw_log: logs[blocks.indices[windowStart]]
      })
    }
  })
  
  return anomalies
}

export function detectExcessiveDownloads(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  const byteSizes = logs
    .map(l => l.client_response_bytes)
    .filter(b => b > 0)
    .sort((a, b) => a - b)
  
  if (byteSizes.length === 0) return anomalies
  
  const p95 = calculatePercentile(byteSizes, 0.95)
  const p99 = calculatePercentile(byteSizes, 0.99)
  const threshold = 100 * 1024 * 1024 // 100MB
  
  logs.forEach((log, index) => {
    const bytes = log.client_response_bytes
    if (bytes > Math.max(p99 * 5, threshold)) {
      const confidence = Math.min(1, bytes / (threshold * 5))
      const severity = bytes > 500 * 1024 * 1024 ? 'high' : 
                      bytes > 200 * 1024 * 1024 ? 'medium' : 'low'
      
      anomalies.push({
        row_index: index,
        rule: 'excessive_download',
        confidence,
        severity,
        explanation: `Large data transfer: ${(bytes / 1024 / 1024).toFixed(2)}MB from ${log.url} by ${log.email}`,
        raw_log: log
      })
    }
  })
  
  return anomalies
}

export function detectBurstRate(logs: CloudflareGatewayLog[], windowSeconds = 60): Anomaly[] {
  const anomalies: Anomaly[] = []
  const windowMs = windowSeconds * 1000
  
  const requestsByIpAndWindow = new Map<string, Map<number, number[]>>()
  
  logs.forEach((log, index) => {
    const timestamp = new Date(log.datetime).getTime()
    const windowKey = Math.floor(timestamp / windowMs)
    
    const ipKey = `${log.source_ip}_${log.email}`
    if (!requestsByIpAndWindow.has(ipKey)) {
      requestsByIpAndWindow.set(ipKey, new Map())
    }
    
    const windows = requestsByIpAndWindow.get(ipKey)!
    if (!windows.has(windowKey)) {
      windows.set(windowKey, [])
    }
    windows.get(windowKey)!.push(index)
  })
  
  requestsByIpAndWindow.forEach((windows, ipKey) => {
    const windowCounts = Array.from(windows.values()).map(indices => indices.length)
    
    if (windowCounts.length < 3) return
    
    const mean = windowCounts.reduce((a, b) => a + b, 0) / windowCounts.length
    const variance = windowCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowCounts.length
    const stdDev = Math.sqrt(variance)
    
    windows.forEach((indices, windowKey) => {
      const count = indices.length
      if (stdDev > 0) {
        const zScore = (count - mean) / stdDev
        if (zScore >= 3 || count > 100) {
          const confidence = Math.min(1, Math.max(zScore / 5, count / 200))
          const severity = zScore > 5 || count > 200 ? 'high' : 'medium'
          
          anomalies.push({
            row_index: indices[0],
            rule: 'burst_rate',
            confidence,
            severity,
            explanation: `Burst detected: ${count} requests from ${ipKey.split('_')[1]} in ${windowSeconds}s (z-score=${zScore.toFixed(1)})`,
            raw_log: logs[indices[0]]
          })
        }
      }
    })
  })
  
  return anomalies
}

export function detectAuthFailures(logs: CloudflareGatewayLog[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const failureWindow = 5 * 60 * 1000 // 5 minutes
  const failureThreshold = 3
  
  const authFailures = new Map<string, { timestamps: number[], indices: number[] }>()
  
  logs.forEach((log, index) => {
    if (log.http_status_code === 401 || log.http_status_code === 403 || 
        log.action === 'block' || log.untrusted_certificate) {
      if (!authFailures.has(log.email)) {
        authFailures.set(log.email, { timestamps: [], indices: [] })
      }
      const failures = authFailures.get(log.email)!
      failures.timestamps.push(new Date(log.datetime).getTime())
      failures.indices.push(index)
    }
  })
  
  authFailures.forEach((failures, user) => {
    for (let i = 0; i < failures.timestamps.length; i++) {
      let count = 1
      const windowEnd = failures.timestamps[i] + failureWindow
      
      for (let j = i + 1; j < failures.timestamps.length && failures.timestamps[j] <= windowEnd; j++) {
        count++
      }
      
      if (count >= failureThreshold) {
        const confidence = Math.min(1, count / (failureThreshold * 3))
        const severity = count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low'
        
        anomalies.push({
          row_index: failures.indices[i],
          rule: 'auth_failure',
          confidence,
          severity,
          explanation: `${count} auth failures/blocks for ${user} within 5 minutes`,
          raw_log: logs[failures.indices[i]]
        })
        break
      }
    }
  })
  
  return anomalies
}

function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0
  const index = Math.ceil(percentile * sortedArray.length) - 1
  return sortedArray[Math.min(index, sortedArray.length - 1)]
}

export function getSeverityFromConfidence(confidence: number): 'critical' | 'high' | 'medium' | 'low' {
  if (confidence >= 0.9) return 'critical'
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}