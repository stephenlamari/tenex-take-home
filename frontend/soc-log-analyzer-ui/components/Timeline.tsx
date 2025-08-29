export function Timeline({ timeline }: { timeline: string }) {
  const lines = timeline.split('\n')
  
  // Helper to render formatted text with bold sections
  const renderFormattedText = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    
    // Match **text** for bold
    const regex = /\*\*([^*]+)\*\*/g
    let match
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      // Add bold text
      parts.push(
        <strong key={match.index} className="font-semibold text-yellow-400">
          {match[1]}
        </strong>
      )
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : text
  }
  
  return (
    <div className="bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-lg border border-slate-700 h-[600px] overflow-y-auto card-glow animate-fadeIn">
      <h3 className="text-xl font-bold text-white mb-4">AI Timeline Analysis</h3>
      <div className="space-y-3 text-sm">
        {lines.map((line, index) => {
          const trimmedLine = line.trim()
          
          if (!trimmedLine) {
            return <div key={index} className="h-2" />
          }
          
          // Headers (##, ###)
          if (trimmedLine.startsWith('### ')) {
            return (
              <h3 key={index} className="text-base font-semibold text-blue-400 mt-4 mb-2">
                {trimmedLine.replace('### ', '')}
              </h3>
            )
          }
          
          if (trimmedLine.startsWith('## ')) {
            return (
              <h2 key={index} className="text-lg font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2">
                {trimmedLine.replace('## ', '')}
              </h2>
            )
          }
          
          // Section headers (text followed by colon, not indented)
          if (!line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
            // Check if this looks like a header (contains bold text or ends with colon)
            if (trimmedLine.includes('**') && trimmedLine.includes(':')) {
              return (
                <div key={index} className="font-semibold text-blue-300 mt-4 mb-2">
                  {renderFormattedText(trimmedLine)}
                </div>
              )
            }
            
            // Plain header lines ending with colon
            if (trimmedLine.endsWith(':')) {
              return (
                <div key={index} className="font-semibold text-blue-300 mt-4 mb-2">
                  {trimmedLine}
                </div>
              )
            }
          }
          
          // Bullet points
          // Treat '•' as a bullet even without a following space, but
          // for '-' and '*' require a space so we don't misclassify '**bold**' lines.
          const isDashOrStarBullet = /^(?:-|\*)\s+/.test(trimmedLine)
          const isDotBullet = trimmedLine.startsWith('•')
          if (isDotBullet || isDashOrStarBullet) {
            let content = trimmedLine
            if (isDotBullet) {
              content = content.replace(/^•\s*/, '')
            } else {
              content = content.replace(/^(?:-|\*)\s+/, '')
            }

            // Fix common LLM formatting quirk: lines like "*Heading:**"
            // Ensure bold markers are symmetric if closing '**' exists.
            if (content.startsWith('*') && !content.startsWith('**') && content.includes('**')) {
              content = `*${content}`
            }
            return (
              <div key={index} className="flex items-start space-x-2 ml-4">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="text-slate-300 flex-1">
                  {renderFormattedText(content)}
                </span>
              </div>
            )
          }
          
          // Numbered lists
          const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/)
          if (numberedMatch) {
            return (
              <div key={index} className="flex items-start space-x-2 ml-4">
                <span className="text-blue-400 mt-0.5">{numberedMatch[1]}.</span>
                <span className="text-slate-300 flex-1">
                  {renderFormattedText(numberedMatch[2])}
                </span>
              </div>
            )
          }
          
          // Time entries (bold time followed by events)
          if (trimmedLine.startsWith('**') && trimmedLine.includes(':**')) {
            const timeMatch = trimmedLine.match(/\*\*([^*]+)\*\*:\s*(.*)/)
            if (timeMatch) {
              return (
                <div key={index} className="flex items-start space-x-3 mt-3">
                  <span className="text-xs font-medium text-blue-300 bg-blue-900/50 border border-blue-700 px-2 py-1 rounded whitespace-nowrap">
                    {timeMatch[1]}
                  </span>
                  <span className="text-slate-300 flex-1">{timeMatch[2]}</span>
                </div>
              )
            }
          }
          
          // Regular paragraphs (indented or not)
          const isIndented = line.startsWith('  ') || line.startsWith('\t')
          return (
            <p key={index} className={`text-slate-300 ${isIndented ? 'ml-8' : 'ml-4'}`}>
              {renderFormattedText(trimmedLine)}
            </p>
          )
        })}
      </div>
    </div>
  )
}
