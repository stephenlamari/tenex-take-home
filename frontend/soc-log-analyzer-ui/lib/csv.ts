import { Anomaly } from './types'
import { formatDate, formatConfidence } from './format'

export function generateAnomaliesCSV(anomalies: Anomaly[]): string {
  const headers = [
    'Rule',
    'Confidence',
    'Explanation',
    'Time',
    'Actor',
    'Source IP',
    'Target Host',
    'URL',
    'Method',
    'Status',
    'Action'
  ]

  const rows = anomalies.map(anomaly => {
    const log = anomaly.raw_log
    return [
      anomaly.rule,
      formatConfidence(anomaly.confidence),
      anomaly.explanation.replace(/"/g, '""'),
      formatDate(log.timestamp),
      log.identityEmail || log.sourceIp,
      log.sourceIp,
      log.host,
      log.url,
      log.method,
      log.status.toString(),
      log.action
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function downloadCSV(content: string, filename: string = 'anomalies.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}