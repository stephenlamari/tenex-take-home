import { Hono, Context } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { cors } from 'hono/cors'
import { Env, AnalysisResult } from './types'
import { processLogFile, getJobResults } from './processor'

const app = new Hono<{ Bindings: Env }>()

app.use(cors())

app.use('/api/*', async (c: Context<{ Bindings: Env }>, next) => {
  const auth = basicAuth({
    username: c.env.AUTH_USERNAME,
    password: c.env.AUTH_PASSWORD,
    realm: 'SOC Log Analyzer',
    verifyUser: (username: string, password: string) => {
      return username === c.env.AUTH_USERNAME && password === c.env.AUTH_PASSWORD
    }
  })
  return auth(c, next)
})

app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400)
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large. Max 10MB for sync processing' }, 413)
    }

    const jobId = crypto.randomUUID()
    const r2Key = `logs/${jobId}/${file.name}`

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

    const analysis = await processLogFile(c.env, file, jobId, r2Key)

    return c.json(analysis)
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