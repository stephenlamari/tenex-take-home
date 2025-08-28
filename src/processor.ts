import { Env, AnalysisResult, CloudflareGatewayLog } from './types'
import { parseLogFile, sortLogsByTimestamp } from './parser'
import { detectAllAnomalies } from './detectors'
import { generateTimeline, generateExecutiveSummary } from './ai-summarizer'

export async function processLogFile(
  env: Env,
  file: File,
  jobId: string,
  r2Key: string
): Promise<AnalysisResult> {
  try {
    console.log(`Processing job ${jobId}, file: ${file.name}`)
    
    const logs = await parseLogFile(file)
    console.log(`Parsed ${logs.length} logs`)
    
    if (logs.length === 0) {
      return {
        jobId,
        status: 'complete',
        totalLogs: 0,
        anomalies: [],
        timeline: 'No valid logs found in the uploaded file.',
        summary: {
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0
        }
      }
    }
    
    const sortedLogs = sortLogsByTimestamp(logs)
    
    const anomalies = detectAllAnomalies(sortedLogs)
    console.log(`Detected ${anomalies.length} anomalies`)
    
    const timeline = await generateTimeline(env, anomalies, sortedLogs)
    const executiveSummary = await generateExecutiveSummary(env, anomalies, logs.length)
    
    const result: AnalysisResult = {
      jobId,
      status: 'complete',
      totalLogs: logs.length,
      anomalies: anomalies.slice(0, 100), // Limit to top 100 anomalies
      timeline,
      summary: {
        criticalCount: anomalies.filter(a => a.severity === 'critical').length,
        highCount: anomalies.filter(a => a.severity === 'high').length,
        mediumCount: anomalies.filter(a => a.severity === 'medium').length,
        lowCount: anomalies.filter(a => a.severity === 'low').length
      }
    }
    
    if (env.DB) {
      await storeResults(env.DB, result)
    }
    
    return result
  } catch (error) {
    console.error('Processing error:', error)
    
    const errorResult: AnalysisResult = {
      jobId,
      status: 'failed',
      totalLogs: 0,
      anomalies: [],
      timeline: 'Processing failed. Please check the log format.',
      summary: {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0
      }
    }
    
    if (env.DB) {
      await storeResults(env.DB, errorResult)
    }
    
    throw error
  }
}

export async function getJobResults(env: Env, jobId: string): Promise<AnalysisResult | null> {
  if (!env.DB) {
    console.log('No database configured, cannot retrieve job results')
    return null
  }
  
  try {
    const result = await env.DB
      .prepare('SELECT * FROM job_results WHERE job_id = ?')
      .bind(jobId)
      .first()
    
    if (!result) return null
    
    return {
      jobId: result.job_id as string,
      status: result.status as any,
      totalLogs: result.total_logs as number,
      anomalies: JSON.parse(result.anomalies as string),
      timeline: result.timeline as string,
      summary: JSON.parse(result.summary as string)
    }
  } catch (error) {
    console.error('Error retrieving job results:', error)
    return null
  }
}

async function storeResults(db: D1Database, result: AnalysisResult): Promise<void> {
  try {
    await db
      .prepare(`
        INSERT OR REPLACE INTO job_results 
        (job_id, status, total_logs, anomalies, timeline, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        result.jobId,
        result.status,
        result.totalLogs,
        JSON.stringify(result.anomalies),
        result.timeline || '',
        JSON.stringify(result.summary),
        new Date().toISOString()
      )
      .run()
  } catch (error) {
    console.error('Error storing results:', error)
  }
}