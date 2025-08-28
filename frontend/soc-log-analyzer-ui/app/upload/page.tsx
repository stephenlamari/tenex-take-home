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
      </div>
    </div>
  )
}