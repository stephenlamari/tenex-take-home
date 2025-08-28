import { Analysis } from '@/lib/types'

export function SummaryCards({ analysis }: { analysis: Analysis }) {
  const topActions = Object.entries(analysis.totals.byAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
  
  const topStatuses = Object.entries(analysis.totals.byStatus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const maxAction = Math.max(...Object.values(analysis.totals.byAction))
  const maxStatus = Math.max(...Object.values(analysis.totals.byStatus))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-lg border border-slate-700 card-glow animate-fadeIn">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-400">Total Logs</h3>
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-3xl font-bold text-white">{analysis.totals.rows.toLocaleString()}</p>
        <p className="text-sm text-slate-400 mt-1">
          {analysis.anomalies.length} anomalies detected
        </p>
      </div>

      <div className="bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-lg border border-slate-700 card-glow animate-fadeIn">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-400">Top Actions</h3>
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-2">
          {topActions.map(([action, count]) => (
            <div key={action}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-200 font-medium">{action}</span>
                <span className="text-slate-400">{count}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full"
                  style={{ width: `${(count / maxAction) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-lg border border-slate-700 card-glow animate-fadeIn">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-400">Top Status Codes</h3>
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="space-y-2">
          {topStatuses.map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-200 font-medium">
                  {status === '0' ? 'Blocked' : status}
                </span>
                <span className="text-slate-400">{count}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${
                    status === '0' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                    status.startsWith('2') ? 'bg-gradient-to-r from-green-500 to-green-400' :
                    status.startsWith('4') ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                    status.startsWith('5') ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-gray-500 to-gray-400'
                  }`}
                  style={{ width: `${(count / maxStatus) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}