export function Timeline({ timeline }: { timeline: string }) {
  const lines = timeline.split('\n').filter(line => line.trim())
  
  const parseTimelineItem = (line: string) => {
    // Check if it's a header (ends with **)
    if (line.includes('**')) {
      return { type: 'header', content: line.replace(/\*\*/g, '') }
    }
    
    // Check if it's a bullet point or numbered item
    const bulletMatch = line.match(/^[\s•\-*]+(.+)/)
    const numberedMatch = line.match(/^[\s]*\d+\.\s*(.+)/)
    const timeMatch = line.match(/^T(\d{2}:\d{2})\*?\*?:?\s*(.+)/)
    
    if (timeMatch) {
      return { type: 'timed', time: timeMatch[1], content: timeMatch[2] }
    } else if (bulletMatch || numberedMatch) {
      return { type: 'bullet', content: (bulletMatch || numberedMatch)?.[1] || line }
    }
    
    return { type: 'text', content: line }
  }
  
  return (
    <div className="bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-lg border border-slate-700 h-[600px] overflow-y-auto card-glow animate-fadeIn">
      <h3 className="text-xl font-bold text-white mb-4">AI Timeline Analysis</h3>
      <div className="space-y-3">
        {lines.map((line, index) => {
          const item = parseTimelineItem(line)
          
          if (item.type === 'header') {
            return (
              <h4 key={index} className="font-semibold text-blue-400 mt-4 mb-2">
                {item.content}
              </h4>
            )
          }
          
          if (item.type === 'timed') {
            return (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-xs font-medium text-blue-300 bg-blue-900/50 border border-blue-700 px-2 py-1 rounded">
                  {item.time}
                </span>
                <span className="text-sm text-slate-300 flex-1">{item.content}</span>
              </div>
            )
          }
          
          if (item.type === 'bullet') {
            return (
              <div key={index} className="flex items-start space-x-2 ml-2">
                <span className="text-blue-400 mt-1">•</span>
                <span className="text-sm text-slate-300 flex-1">{item.content}</span>
              </div>
            )
          }
          
          return (
            <p key={index} className="text-sm text-slate-300">
              {item.content}
            </p>
          )
        })}
      </div>
    </div>
  )
}