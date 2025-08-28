import { describe, it, expect } from 'vitest'
import { formatDate, formatBytes, formatConfidence, getConfidenceColor, truncateUrl } from '../lib/format'

describe('formatDate', () => {
  it('formats ISO date string correctly', () => {
    const date = '2024-01-15T14:30:45.000Z'
    expect(formatDate(date)).toBe('Jan 15, 2024, 14:30:45')
  })
})

describe('formatBytes', () => {
  it('handles undefined/null', () => {
    expect(formatBytes(undefined)).toBe('-')
    expect(formatBytes(null as any)).toBe('-')
  })

  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats various byte sizes', () => {
    expect(formatBytes(512)).toBe('512.0 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
    expect(formatBytes(5242880)).toBe('5.0 MB')
  })
})

describe('formatConfidence', () => {
  it('formats confidence as percentage', () => {
    expect(formatConfidence(0.95)).toBe('95%')
    expect(formatConfidence(0.7)).toBe('70%')
    expect(formatConfidence(0.333)).toBe('33%')
    expect(formatConfidence(1)).toBe('100%')
  })
})

describe('getConfidenceColor', () => {
  it('returns correct color class based on confidence', () => {
    expect(getConfidenceColor(0.3)).toBe('text-gray-600')
    expect(getConfidenceColor(0.5)).toBe('text-yellow-600')
    expect(getConfidenceColor(0.8)).toBe('text-red-600')
  })
})

describe('truncateUrl', () => {
  it('does not truncate short URLs', () => {
    const url = 'https://example.com'
    expect(truncateUrl(url, 50)).toBe(url)
  })

  it('truncates long URLs', () => {
    const url = 'https://example.com/very/long/path/that/exceeds/the/maximum/length'
    expect(truncateUrl(url, 30)).toBe('https://example.com/very/lo...')
  })
})