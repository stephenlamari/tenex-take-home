import { Hono, Context } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { cors } from 'hono/cors'
import { Env, AnalysisResult } from './types'
import { processLogFile, getJobResults } from './processor'

const app = new Hono<{ Bindings: Env }>()

const jobStore = new Map<string, any>()

app.use('*', cors({
  origin: (origin) => {
    console.log('CORS request from:', origin)
    
    // Allow any subdomain of your Pages project and localhost for development
    if (!origin) return '*'
    
    const allowedPatterns = [
      /^https:\/\/[a-z0-9]+\.soc-log-analyzer-ui\.pages\.dev$/, 
      /^https:\/\/soc-log-analyzer-ui\.pages\.dev$/,            
      /^http:\/\/localhost:\d+$/                             
    ]
    
    if (allowedPatterns.some(pattern => pattern.test(origin))) {
      return origin
    }
    
    return false
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS']
}))

app.use('/api/*', async (c: Context<{ Bindings: Env }>, next) => {
  // Skip auth for OPTIONS requests (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return next()
  }
  
  const auth = basicAuth({
    username: c.env.AUTH_USERNAME || 'admin',
    password: c.env.AUTH_PASSWORD || 'devpassword',
    realm: 'SOC Log Analyzer',
    verifyUser: (username: string, password: string) => {
      const expectedUser = c.env.AUTH_USERNAME || 'admin'
      const expectedPass = c.env.AUTH_PASSWORD || 'devpassword'
      console.log('Auth attempt:', { username, expectedUser, matches: username === expectedUser && password === expectedPass })
      return username === expectedUser && password === expectedPass
    }
  })
  return auth(c, next)
})

app.get('/api/health', async (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    auth: 'verified'
  })
})

app.post('/api/upload', async (c) => {
  console.log('POST /api/upload received')
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const providedJobId = (formData.get('jobId') as string | null) || undefined
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400)
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large. Max 10MB for sync processing' }, 413)
    }

    const jobId = providedJobId || crypto.randomUUID()
    const r2Key = `logs/${jobId}/original.json`

    // Initialize job for polling with processing state
    jobStore.set(jobId, {
      jobId,
      status: 'processing',
      processingStage: {
        current: 'uploading',
        progress: 5,
        message: 'Receiving file...'
      }
    })

    await c.env.LOG_STORAGE.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'text/plain',
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size.toString()
      }
    })

    // Mark upload as complete, move to parsing stage
    jobStore.set(jobId, {
      jobId,
      status: 'processing',
      processingStage: {
        current: 'parsing',
        progress: 0,
        message: 'Reading and parsing log file...'
      }
    })

    // Helper to update job progress for polling clients
    const reportProgress = (
      stage: 'uploading' | 'parsing' | 'detecting' | 'analyzing' | 'ai_processing' | 'compiling',
      progress: number,
      message?: string,
      itemsProcessed?: number,
      totalItems?: number,
      estimatedTimeRemaining?: number,
    ) => {
      const current = jobStore.get(jobId) || { jobId, status: 'processing' }
      jobStore.set(jobId, {
        ...current,
        jobId,
        status: 'processing',
        processingStage: {
          current: stage,
          progress,
          message: message || current?.processingStage?.message || '',
          itemsProcessed,
          totalItems,
          estimatedTimeRemaining,
        }
      })
    }

    const analysis = await processLogFile(c.env, file, jobId, r2Key, reportProgress)

    // Parse logs again to get statistics (since analysis doesn't return raw logs)
    const fileClone = new File([await file.text()], file.name)
    const { parseLogFile } = await import('./parser')
    const logs = await parseLogFile(fileClone)
    
    const byAction: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    
    logs.forEach((log: any) => {
      const action = log.action || 'unknown'
      const status = log.http_status_code?.toString() || '0'
      
      byAction[action] = (byAction[action] || 0) + 1
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    const response = {
      jobId: analysis.jobId,
      status: 'complete' as const,
      analysis: {
        anomalies: analysis.anomalies.map(anomaly => ({
          ...anomaly,
          raw_log: {
            timestamp: anomaly.raw_log.datetime,
            sourceIp: anomaly.raw_log.source_ip,
            identityEmail: anomaly.raw_log.email,
            deviceName: anomaly.raw_log.device_name,
            host: anomaly.raw_log.http_host || new URL(anomaly.raw_log.url || 'http://unknown').hostname,
            url: anomaly.raw_log.url,
            method: anomaly.raw_log.http_method,
            status: anomaly.raw_log.http_status_code,
            action: anomaly.raw_log.action,
            bytesIn: anomaly.raw_log.client_request_bytes,
            bytesOut: anomaly.raw_log.client_response_bytes,
            userAgent: anomaly.raw_log.user_agent,
            policyName: anomaly.raw_log.policy_name
          }
        })),
        timeline: analysis.timeline,
        totals: {
          rows: analysis.totalLogs,
          byAction,
          byStatus
        }
      }
    }

    // Store in memory with logs for rows endpoint
    jobStore.set(analysis.jobId, { ...response, logs })

    return c.json(response)
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ 
      error: 'Failed to process log file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

app.get('/api/jobs/:id', async (c) => {
  const jobId = c.req.param('id')
  
  // First check in-memory store
  const storedResult = jobStore.get(jobId)
  if (storedResult) {
    return c.json(storedResult)
  }
  
  // Fallback to database if configured
  try {
    const results = await getJobResults(c.env, jobId)
    if (!results) {
      return c.json({ error: 'Job not found' }, 404)
    }
    return c.json(results)
  } catch (error) {
    console.error('Get job error:', error)
    return c.json({ error: 'Failed to retrieve job results' }, 500)
  }
})

app.get('/api/jobs/:id/rows', async (c) => {
  const jobId = c.req.param('id')
  const offset = parseInt(c.req.query('offset') || '0')
  const limit = parseInt(c.req.query('limit') || '200')
  
  const storedResult = jobStore.get(jobId)
  if (!storedResult || !storedResult.logs) {
    return c.json({ rows: [], total: 0 })
  }
  
  // Transform logs to frontend format
  const rows = storedResult.logs.slice(offset, offset + limit).map((log: any) => ({
    timestamp: log.datetime,
    sourceIp: log.source_ip,
    identityEmail: log.email,
    deviceName: log.device_name,
    host: log.http_host || new URL(log.url || 'http://unknown').hostname,
    url: log.url,
    method: log.http_method,
    status: log.http_status_code,
    action: log.action,
    bytesIn: log.client_request_bytes,
    bytesOut: log.client_response_bytes,
    userAgent: log.user_agent,
    policyName: log.policy_name
  }))
  
  return c.json({ 
    rows,
    total: storedResult.logs.length
  })
})

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

app.get('/', (c) => {
  return c.text('SOC Log Analyzer API - Use /api/upload to analyze logs')
})

export default app
