import { describe, expect, it } from 'vitest'

import {
  MEMORY_CAPTURE_CONFIDENCE_THRESHOLD,
  MEMORY_STATUS,
  computeFreshnessFactor,
  parseMemoryCaptureResponse,
  rerankMemoryCandidates,
  shouldPersistCapturedEntry,
  summarizeMemoryStats,
} from './index.js'

describe('packages/memory', () => {
  it('boosts exact title and topic matches over weak generic matches', () => {
    const results = rerankMemoryCandidates({
      query: 'repo convention',
      limit: 2,
      candidates: [
        {
          id: 'exact',
          title: 'repo convention',
          content: 'Use pnpm for all workspace scripts.',
          topicKey: 'repo-convention',
          tags: ['repo'],
          confidence: 0.7,
          ftsRank: 0.35,
        },
        {
          id: 'weak',
          title: 'development notes',
          content: 'Some repo convention details appear here.',
          topicKey: 'notes',
          tags: [],
          confidence: 0.7,
          ftsRank: 0.8,
        },
      ],
    })

    expect(results[0]?.id).toBe('exact')
    expect(results[0]?.matchReasons).toContain('exact_title')
  })

  it('uses reinforcement timestamps for freshness ahead of stale updatedAt values', () => {
    const staleUpdated = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const recentReinforced = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const freshness = computeFreshnessFactor({
      updatedAt: staleUpdated,
      reinforcedAt: recentReinforced,
      timesUsed: 3,
    })

    expect(freshness).toBeGreaterThan(0.95)
  })

  it('parses structured capture JSON and enforces the persistence threshold', () => {
    const parsed = parseMemoryCaptureResponse(`
      {
        "entries": [
          {
            "kind": "decision",
            "title": "Use cloud memory API",
            "content": "Cloud runtime forwards memory operations to cloud-api.",
            "topicKey": "cloud-memory-api",
            "tags": ["cloud", "memory"],
            "confidence": 0.91,
            "visibility": "shared"
          },
          {
            "kind": "summary",
            "title": "Weak summary",
            "content": "Short note",
            "confidence": 0.2
          }
        ]
      }
    `)

    expect(parsed).toHaveLength(2)
    expect(shouldPersistCapturedEntry(parsed[0])).toBe(true)
    expect(parsed[0]?.visibility).toBe('shared')
    expect(shouldPersistCapturedEntry(parsed[1])).toBe(false)
    expect(MEMORY_CAPTURE_CONFIDENCE_THRESHOLD).toBeGreaterThan(0.5)
  })

  it('summarizes status and scope counts', () => {
    const stats = summarizeMemoryStats([
      { kind: 'decision', scope: 'project', status: MEMORY_STATUS.ACTIVE },
      { kind: 'summary', scope: 'global', status: MEMORY_STATUS.SUPERSEDED },
      { kind: 'fact', scope: 'global', status: MEMORY_STATUS.ACTIVE },
    ])

    expect(stats.total).toBe(3)
    expect(stats.active).toBe(2)
    expect(stats.superseded).toBe(1)
    expect(stats.byScope.project).toBe(1)
    expect(stats.byKind.summary).toBe(1)
  })
})
