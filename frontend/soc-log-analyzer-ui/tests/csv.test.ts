import { describe, it, expect } from 'vitest'
import { generateAnomaliesCSV } from '../lib/csv'
import { Anomaly, GatewayLog } from '../lib/types'

describe('generateAnomaliesCSV', () => {
  it('generates CSV with headers and data', () => {
    const mockLog: GatewayLog = {
      timestamp: '2024-01-15T14:30:45.000Z',
      sourceIp: '192.168.1.1',
      identityEmail: 'user@example.com',
      deviceName: 'laptop-01',
      host: 'malicious.com',
      url: '/api/data',
      method: 'POST',
      status: 403,
      action: 'block',
      bytesIn: 1024,
      bytesOut: 512,
      userAgent: 'Mozilla/5.0',
      policyName: 'security-policy'
    }

    const anomalies: Anomaly[] = [
      {
        row_index: 0,
        rule: 'Threat Detection',
        confidence: 0.95,
        explanation: 'Blocked access to known malicious domain',
        raw_log: mockLog
      }
    ]

    const csv = generateAnomaliesCSV(anomalies)
    
    expect(csv).toContain('Rule,Confidence,Explanation,Time,Actor,Source IP,Target Host,URL,Method,Status,Action')
    expect(csv).toContain('Threat Detection')
    expect(csv).toContain('95%')
    expect(csv).toContain('malicious.com')
    expect(csv).toContain('user@example.com')
  })

  it('escapes quotes in explanation', () => {
    const mockLog: GatewayLog = {
      timestamp: '2024-01-15T14:30:45.000Z',
      sourceIp: '192.168.1.1',
      host: 'example.com',
      url: '/',
      method: 'GET',
      status: 200,
      action: 'allow'
    }

    const anomalies: Anomaly[] = [
      {
        row_index: 0,
        rule: 'Test Rule',
        confidence: 0.5,
        explanation: 'Test with "quotes" in text',
        raw_log: mockLog
      }
    ]

    const csv = generateAnomaliesCSV(anomalies)
    expect(csv).toContain('Test with ""quotes"" in text')
  })
})