import { UploadForm } from '@/components/UploadForm'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="gradient-text">SOC Log Analyzer</span>
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            Upload Cloudflare Gateway logs to detect security anomalies
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Powered by AI-driven analysis and deterministic detection algorithms
          </p>
        </div>
        <UploadForm />
        
        <div className="mt-12 p-6 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 animate-fadeIn">
          <h2 className="text-lg font-semibold text-white mb-3">Sample Data</h2>
          <p className="text-sm text-slate-300 mb-4">
            Need test data? Download our sample Cloudflare Gateway logs that contain various security anomalies for testing.
          </p>
          <a 
            href="/sample-gateway-logs.json"
            download="gateway-anomalous.json"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Download Sample Logs
          </a>
          <div className="mt-3 text-xs text-slate-400">
            Contains: DLP violations, threat detections, suspicious categories, and various security events
          </div>
        </div>
      </div>
    </div>
  )
}