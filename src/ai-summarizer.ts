import { Env, Anomaly, CloudflareGatewayLog } from './types'

export async function generateTimeline(
  env: Env,
  anomalies: Anomaly[],
  logs: CloudflareGatewayLog[]
): Promise<string> {
  if (anomalies.length === 0) {
    return 'No security anomalies detected in the analyzed logs.'
  }

  const timeGroups = groupAnomaliesByTime(anomalies, logs)
  const criticalEvents = anomalies.filter(a => a.severity === 'critical')
  const highEvents = anomalies.filter(a => a.severity === 'high')
  
  const prompt = buildTimelinePrompt(timeGroups, criticalEvents, highEvents)
  
  try {
    const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt,
      max_tokens: 500,
      temperature: 0.3
    })
    
    return response.response || generateFallbackTimeline(timeGroups, criticalEvents)
  } catch (error) {
    console.error('AI timeline generation failed:', error)
    return generateFallbackTimeline(timeGroups, criticalEvents)
  }
}

function groupAnomaliesByTime(
  anomalies: Anomaly[], 
  logs: CloudflareGatewayLog[]
): Record<string, Anomaly[]> {
  const groups: Record<string, Anomaly[]> = {}
  
  anomalies.forEach(anomaly => {
    const log = logs[anomaly.row_index]
    if (!log) return
    
    const hour = new Date(log.datetime).toISOString().slice(0, 13)
    if (!groups[hour]) groups[hour] = []
    groups[hour].push(anomaly)
  })
  
  return groups
}

function buildTimelinePrompt(
  timeGroups: Record<string, Anomaly[]>,
  criticalEvents: Anomaly[],
  highEvents: Anomaly[]
): string {
  const sortedHours = Object.keys(timeGroups).sort()
  
  return `You are a SOC analyst reviewing security events. Create a concise timeline summary.

CRITICAL EVENTS (${criticalEvents.length}):
${criticalEvents.slice(0, 5).map(e => `- ${e.explanation}`).join('\n')}

HIGH PRIORITY EVENTS (${highEvents.length}):
${highEvents.slice(0, 5).map(e => `- ${e.explanation}`).join('\n')}

TIMELINE BY HOUR:
${sortedHours.map(hour => {
  const events = timeGroups[hour]
  return `${hour}: ${events.length} events
  - ${events.slice(0, 3).map(e => e.rule).join(', ')}`
}).join('\n')}

Create a SOC analyst timeline that:
1. Highlights critical security incidents
2. Identifies attack patterns or campaigns
3. Suggests immediate actions
4. Is formatted as bullet points with timestamps

Keep response under 400 words. Focus on actionable intelligence.`
}

function generateFallbackTimeline(
  timeGroups: Record<string, Anomaly[]>,
  criticalEvents: Anomaly[]
): string {
  const sortedHours = Object.keys(timeGroups).sort()
  
  let timeline = '## Security Event Timeline\n\n'
  
  if (criticalEvents.length > 0) {
    timeline += '### 🚨 Critical Events Requiring Immediate Action\n'
    criticalEvents.slice(0, 5).forEach(event => {
      timeline += `- ${event.explanation}\n`
    })
    timeline += '\n'
  }
  
  timeline += '### Timeline Summary\n'
  sortedHours.forEach(hour => {
    const events = timeGroups[hour]
    const critical = events.filter(e => e.severity === 'critical').length
    const high = events.filter(e => e.severity === 'high').length
    
    timeline += `**${hour}:00** - ${events.length} events`
    if (critical > 0) timeline += ` (${critical} critical)`
    if (high > 0) timeline += ` (${high} high)`
    timeline += '\n'
    
    const topEvents = events.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
    topEvents.forEach(event => {
      timeline += `  • ${event.rule}: ${event.explanation.slice(0, 80)}...\n`
    })
  })
  
  timeline += '\n### Recommended Actions\n'
  timeline += '1. Review all critical DLP violations immediately\n'
  timeline += '2. Investigate users with repeated block actions\n'
  timeline += '3. Check for data exfiltration attempts\n'
  timeline += '4. Verify threat detection alerts are properly handled\n'
  
  return timeline
}

export async function generateExecutiveSummary(
  env: Env,
  anomalies: Anomaly[],
  totalLogs: number
): Promise<string> {
  const summary = {
    total_logs: totalLogs,
    total_anomalies: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
    top_rules: getTopRules(anomalies),
    affected_users: getAffectedUsers(anomalies)
  }
  
  const prompt = `Generate a brief executive summary of these security findings:
${JSON.stringify(summary, null, 2)}

Format as 3-4 concise bullet points focusing on:
1. Overall security posture
2. Most critical findings
3. Recommended actions

Keep it under 100 words total.`

  try {
    const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt,
      max_tokens: 150,
      temperature: 0.3
    })
    
    return response.response || generateFallbackSummary(summary)
  } catch (error) {
    console.error('AI summary generation failed:', error)
    return generateFallbackSummary(summary)
  }
}

function generateFallbackSummary(summary: any): string {
  return `## Security Analysis Summary
• Analyzed ${summary.total_logs} logs, detected ${summary.total_anomalies} anomalies
• Critical issues: ${summary.critical} DLP/threat detections requiring immediate review
• Top concerns: ${summary.top_rules.slice(0, 3).map((r: any) => r.rule).join(', ')}
• Action required: Review ${summary.affected_users.length} affected users for potential compromise`
}

function getTopRules(anomalies: Anomaly[]): Array<{rule: string, count: number}> {
  const ruleCounts = new Map<string, number>()
  
  anomalies.forEach(a => {
    ruleCounts.set(a.rule, (ruleCounts.get(a.rule) || 0) + 1)
  })
  
  return Array.from(ruleCounts.entries())
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
}

function getAffectedUsers(anomalies: Anomaly[]): string[] {
  const users = new Set<string>()
  
  anomalies.forEach(a => {
    const log = a.raw_log as CloudflareGatewayLog
    if (log?.email) {
      users.add(log.email)
    }
  })
  
  return Array.from(users)
}