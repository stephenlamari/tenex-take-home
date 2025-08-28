import { CloudflareGatewayLog } from './types'

export function parseGatewayLog(logLine: string): CloudflareGatewayLog | null {
  const trimmedLine = logLine.trim()
  if (!trimmedLine || trimmedLine.startsWith('#')) {
    return null
  }

  try {
    const log = JSON.parse(trimmedLine)
    
    return {
      datetime: log.Datetime || log.datetime,
      device_id: log.DeviceID || log.device_id,
      device_name: log.DeviceName || log.device_name,
      email: log.Email || log.email,
      source_ip: log.SourceIP || log.source_ip,
      destination_ip: log.DestinationIP || log.destination_ip,
      url: log.URL || log.url || `https://${log.HTTPHost || log.http_host}${log.HTTPPath || ''}`,
      http_host: log.HTTPHost || log.http_host,
      http_method: log.HTTPMethod || log.http_method || 'GET',
      http_status_code: log.HTTPStatusCode || log.http_status_code || 0,
      action: (log.Action || log.action || 'allow').toLowerCase() as any,
      policy_name: log.PolicyName || log.policy_name,
      policy_id: log.PolicyID || log.policy_id,
      categories: log.Categories || log.categories || [],
      client_request_bytes: log.ClientRequestBytes || log.client_request_bytes || 0,
      client_response_bytes: log.ClientResponseBytes || log.client_response_bytes || 0,
      user_agent: log.UserAgent || log.user_agent || '',
      matched_detections: log.MatchedDetections || log.matched_detections || [],
      dlp_profiles: log.DLPProfiles || log.dlp_profiles || [],
      is_isolated: log.IsIsolated || log.is_isolated || false,
      untrusted_certificate: log.UntrustedCertificate || log.untrusted_certificate || false,
      request_id: log.RequestID || log.request_id
    }
  } catch (error) {
    return parseGatewayTextFormat(trimmedLine)
  }
}

function parseGatewayTextFormat(line: string): CloudflareGatewayLog | null {
  const parts = line.split(',').map(p => p.trim())
  if (parts.length < 9) return null
  
  return {
    datetime: parts[0],
    email: parts[1],
    source_ip: parts[2],
    url: parts[3],
    http_method: parts[4] || 'GET',
    http_status_code: parseInt(parts[5]) || 0,
    action: (parts[6] || 'allow') as any,
    client_request_bytes: parseInt(parts[7]) || 0,
    client_response_bytes: parseInt(parts[8]) || 0,
    user_agent: parts[9] || '',
    categories: parts[10]?.split(';') || [],
    matched_detections: parts[11]?.split(';') || [],
    dlp_profiles: parts[12]?.split(';') || []
  }
}

export async function parseLogFile(file: File): Promise<CloudflareGatewayLog[]> {
  const text = await file.text()
  const lines = text.split('\n')
  
  const logs = lines
    .map((line, index) => {
      const parsed = parseGatewayLog(line)
      if (parsed && !isValidGatewayLog(parsed)) {
        console.warn(`Invalid log data at line ${index + 1}:`, parsed)
        return null
      }
      return parsed
    })
    .filter((log): log is CloudflareGatewayLog => log !== null)
  
  console.log(`Parsed ${logs.length} valid Gateway logs from ${lines.length} lines`)
  return logs
}

function isValidGatewayLog(log: CloudflareGatewayLog): boolean {
  try {
    const date = new Date(log.datetime)
    if (isNaN(date.getTime())) {
      return false
    }
  } catch {
    return false
  }
  
  if (!isValidIP(log.source_ip)) {
    return false
  }
  
  if (!log.email || !log.url) {
    return false
  }
  
  if (log.http_status_code && (log.http_status_code < 0 || log.http_status_code >= 600)) {
    return false
  }
  
  if (log.client_request_bytes < 0 || log.client_response_bytes < 0) {
    return false
  }
  
  return true
}

function isValidIP(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipRegex.test(ip)) {
    return false
  }
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part)
    return num >= 0 && num <= 255
  })
}

export function sortLogsByTimestamp(logs: CloudflareGatewayLog[]): CloudflareGatewayLog[] {
  return [...logs].sort((a, b) => {
    const dateA = new Date(a.datetime).getTime()
    const dateB = new Date(b.datetime).getTime()
    return dateA - dateB
  })
}