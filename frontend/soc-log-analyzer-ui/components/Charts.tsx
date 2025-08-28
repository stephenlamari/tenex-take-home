'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Analysis, GatewayLog, Anomaly } from '@/lib/types'

interface ChartsProps {
  analysis: Analysis
  logs?: GatewayLog[]
  anomalies: Anomaly[]
}

export function Charts({ analysis, logs = [], anomalies }: ChartsProps) {
  const hourlyData = useMemo(() => {
    if (logs.length === 0) return []
    
    const hourMap = new Map<string, { 
      hour: string
      success: number
      client_error: number
      server_error: number
      anomalies: number
    }>()
    
    logs.forEach(log => {
      const date = new Date(log.timestamp)
      const hour = `${date.getUTCHours().toString().padStart(2, '0')}:00`
      
      if (!hourMap.has(hour)) {
        hourMap.set(hour, {
          hour,
          success: 0,
          client_error: 0,
          server_error: 0,
          anomalies: 0
        })
      }
      
      const entry = hourMap.get(hour)!
      if (log.status >= 200 && log.status < 300) entry.success++
      else if (log.status >= 400 && log.status < 500) entry.client_error++
      else if (log.status >= 500) entry.server_error++
    })
    
    anomalies.forEach(anomaly => {
      const date = new Date(anomaly.raw_log.timestamp)
      const hour = `${date.getUTCHours().toString().padStart(2, '0')}:00`
      const entry = hourMap.get(hour)
      if (entry) entry.anomalies++
    })
    
    return Array.from(hourMap.values()).sort((a, b) => a.hour.localeCompare(b.hour))
  }, [logs, anomalies])

  const anomalyTrend = useMemo(() => {
    if (anomalies.length === 0) return []
    
    const timeMap = new Map<string, number>()
    
    anomalies.forEach(anomaly => {
      if (!anomaly.raw_log?.timestamp) return
      
      const date = new Date(anomaly.raw_log.timestamp)
      if (isNaN(date.getTime())) return
      
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = Math.floor(date.getUTCMinutes() / 10) * 10
      const timeKey = `${hours}:${minutes.toString().padStart(2, '0')}`
      timeMap.set(timeKey, (timeMap.get(timeKey) || 0) + 1)
    })
    
    return Array.from(timeMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [anomalies])

  if (hourlyData.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Status Codes by Hour</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.5} />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              stroke="#64748b"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              stroke="#64748b"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#f1f5f9'
              }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey="success" stackId="a" fill="#10b981" name="2xx" />
            <Bar dataKey="client_error" stackId="a" fill="#f59e0b" name="4xx" />
            <Bar dataKey="server_error" stackId="a" fill="#ef4444" name="5xx" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Anomaly Detection Trend</h3>
        {anomalyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.5} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f1f5f9'
                }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Anomalies"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-400">
            <p>No anomalies to display</p>
          </div>
        )}
      </div>
    </div>
  )
}