import { useState, useEffect, useCallback } from 'react'
import { aiRecommendations, type AIRecommendation } from '@/lib/ai-data'

export function useAiAgents() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(aiRecommendations)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 1500)
  }, [])

  const filterByAgent = useCallback(
    (agent: AIRecommendation['agent']) => recommendations.filter((r) => r.agent === agent),
    [recommendations],
  )

  const filterByPriority = useCallback(
    (priority: AIRecommendation['priority']) =>
      recommendations.filter((r) => r.priority === priority),
    [recommendations],
  )

  const criticalCount = recommendations.filter((r) => r.priority === 'critical').length

  useEffect(() => {
    const interval = setInterval(() => {
      runAnalysis()
    }, 60000)
    return () => clearInterval(interval)
  }, [runAnalysis])

  return {
    recommendations,
    isAnalyzing,
    runAnalysis,
    filterByAgent,
    filterByPriority,
    criticalCount,
  }
}
