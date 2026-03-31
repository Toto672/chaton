import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Beaker, Trophy, X, RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

type MetaHarnessCandidateSummary = Record<string, unknown> & {
  id?: string
  name?: string
  description?: string
  active?: boolean
  objective?: string
  latestScore?: Record<string, unknown> | null
}

type MetaHarnessFrontierEntry = Record<string, unknown> & {
  candidateId?: string
  totalScore?: number
  successRate?: number
  averageLatencyMs?: number
  rank?: number
}

type MetaHarnessPanelProps = {
  isOpen: boolean
  onClose: () => void
}

function formatPercent(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a'
  return `${Math.round(value * 100)}%`
}

function formatNumber(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a'
  return value.toFixed(2)
}

function formatLatency(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a'
  return `${Math.round(value)} ms`
}

export function MetaHarnessPanel({ isOpen, onClose }: MetaHarnessPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [benchmarkId, setBenchmarkId] = useState('default')
  const [resolvedBenchmarkId, setResolvedBenchmarkId] = useState('default')
  const [activeCandidateId, setActiveCandidateId] = useState<string>('baseline')
  const [candidates, setCandidates] = useState<MetaHarnessCandidateSummary[]>([])
  const [frontier, setFrontier] = useState<MetaHarnessFrontierEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!window.pi) return
    setIsLoading(true)
    setError(null)
    try {
      const [candidateResult, frontierResult] = await Promise.all([
        window.pi.metaHarnessListCandidates(benchmarkId),
        window.pi.metaHarnessGetFrontier(benchmarkId),
      ])
      setResolvedBenchmarkId(candidateResult.benchmarkId)
      setActiveCandidateId(candidateResult.activeCandidateId)
      setCandidates(candidateResult.candidates as MetaHarnessCandidateSummary[])
      setFrontier(frontierResult.frontier as MetaHarnessFrontierEntry[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [benchmarkId])

  useEffect(() => {
    if (!isOpen) return
    void loadData()
  }, [isOpen, loadData])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen, onClose])

  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((left, right) => {
      const leftActive = left.active || left.id === activeCandidateId
      const rightActive = right.active || right.id === activeCandidateId
      if (leftActive !== rightActive) return leftActive ? -1 : 1
      return String(left.id ?? '').localeCompare(String(right.id ?? ''))
    })
  }, [activeCandidateId, candidates])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-6 py-8 backdrop-blur-sm dark:bg-black/70">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Meta-Harness"
        className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meta-Harness</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hidden maintainer view for candidate and frontier inspection.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Meta-Harness panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="meta-harness-benchmark-id">
            Benchmark
          </label>
          <input
            id="meta-harness-benchmark-id"
            value={benchmarkId}
            onChange={(event) => setBenchmarkId(event.target.value)}
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="default"
          />
          <Button variant="secondary" size="sm" onClick={() => void loadData()} disabled={isLoading}>
            Load
          </Button>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5" />
            Active candidate: <span className="font-medium text-slate-900 dark:text-slate-100">{activeCandidateId || 'baseline'}</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <section className="min-h-0 overflow-auto border-b border-slate-200 p-5 dark:border-slate-800 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Candidates</h3>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {!error && rankedCandidates.length === 0 && !isLoading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No candidates archived for benchmark <span className="font-medium">{resolvedBenchmarkId}</span>.
              </div>
            ) : null}

            <div className="space-y-3">
              {rankedCandidates.map((candidate) => {
                const latestScore = candidate.latestScore ?? null
                const totalScore = latestScore && typeof latestScore === 'object' ? (latestScore as Record<string, unknown>).totalScore : undefined
                const successRate = latestScore && typeof latestScore === 'object' ? (latestScore as Record<string, unknown>).successRate : undefined
                const averageLatencyMs = latestScore && typeof latestScore === 'object' ? (latestScore as Record<string, unknown>).averageLatencyMs : undefined
                const isActive = candidate.active || candidate.id === activeCandidateId

                return (
                  <article
                    key={String(candidate.id ?? `candidate-${candidate.name ?? 'unknown'}`)}
                    className={`rounded-2xl border p-4 ${isActive
                      ? 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {candidate.name || candidate.id || 'Unnamed candidate'}
                          </h4>
                          {isActive ? (
                            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{candidate.id || 'unknown-id'}</p>
                        {candidate.description ? (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{candidate.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        <div>Score {formatNumber(totalScore)}</div>
                        <div>Success {formatPercent(successRate)}</div>
                        <div>Latency {formatLatency(averageLatencyMs)}</div>
                      </div>
                    </div>
                    {candidate.objective ? (
                      <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
                        {candidate.objective}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="min-h-0 overflow-auto p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Frontier</h3>
            </div>

            {frontier.length === 0 && !isLoading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No frontier entries for benchmark <span className="font-medium">{resolvedBenchmarkId}</span>.
              </div>
            ) : null}

            <div className="space-y-3">
              {frontier.map((entry, index) => (
                <article
                  key={`${String(entry.candidateId ?? 'candidate')}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Rank #{entry.rank ?? index + 1}
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {entry.candidateId || 'unknown-candidate'}
                      </h4>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <div>Score {formatNumber(entry.totalScore)}</div>
                      <div>Success {formatPercent(entry.successRate)}</div>
                      <div>Latency {formatLatency(entry.averageLatencyMs)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
