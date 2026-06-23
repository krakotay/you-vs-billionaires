import { useEffect, useState } from 'react'
import './App.css'
import {
  FALLBACK_LIST,
  fetchLatestList,
  WORLD_POPULATION,
  type RtbList,
} from './api'
import { SEGMENTS, Wheel } from './Wheel'
import { Comparison } from './Comparison'

const STORAGE_KEY = 'yvb_assessment_v1'

interface Assessment {
  billions: number
  assessedAt: string
  count: number
}

function loadAssessment(): Assessment | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Assessment) : null
  } catch {
    return null
  }
}

/**
 * Pick a segment by honest statistics: the chance of being a billionaire at all
 * is count / world population (~1 in 2.4 million). Almost everyone lands on $0B.
 * The tiers above only matter in the vanishing case that you are one of them.
 */
function rollTarget(count: number): number {
  const pBillionaire = count / WORLD_POPULATION
  if (Math.random() >= pBillionaire) return 0 // the overwhelming reality: $0B

  // You beat the odds. Distribute across the >$0 tiers by rough rarity.
  const r = Math.random()
  if (r < 0.6) return 1 // $1B
  if (r < 0.9) return 2 // $10B
  if (r < 0.99) return 3 // $100B
  return 4 // $100B+
}

type Phase = 'ready' | 'spinning' | 'result'

export default function App() {
  const [phase, setPhase] = useState<Phase>(() =>
    loadAssessment() ? 'result' : 'ready',
  )
  const [count, setCount] = useState(FALLBACK_LIST.count)
  const [list, setList] = useState<RtbList>(FALLBACK_LIST)
  const [error, setError] = useState<string | null>(null)

  const [targetIndex, setTargetIndex] = useState(0)
  const [assessment, setAssessment] = useState<Assessment | null>(loadAssessment)

  useEffect(() => {
    let alive = true
    fetchLatestList()
      .then((l) => {
        if (!alive) return
        setCount(l.count)
        setList(l)
        setError(null)
      })
      .catch((e) => {
        if (!alive) return
        console.warn('RTB API direct feed lagged; using local fallback.', e)
        setError(String(e))
      })
    return () => {
      alive = false
    }
  }, [])

  const odds = Math.round(WORLD_POPULATION / count).toLocaleString('en-US')

  function handleSpin() {
    setTargetIndex(rollTarget(count))
    setPhase('spinning')
  }

  function handleSettled() {
    const billions = SEGMENTS[targetIndex].billions
    const next: Assessment = {
      billions,
      assessedAt: new Date().toISOString(),
      count: count ?? 0,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAssessment(next)
    setPhase('result')
  }

  function handleReassess() {
    localStorage.removeItem(STORAGE_KEY)
    setAssessment(null)
    setPhase('ready')
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>You vs. Billionaires</h1>
        <p className="tagline">
          A statistical assessment of your net worth, benchmarked against the
          world's wealthiest individuals.
        </p>
      </header>

      {error && (
        <div className="card error">
          <p>Could not reach the billionaires data service.</p>
          <code>{error}</code>
        </div>
      )}

      {(phase === 'ready' || phase === 'spinning') && (
        <div className="card center">
          <p className="lede">
            Spin to receive your statistically determined net worth.
          </p>
          <Wheel
            targetIndex={targetIndex}
            spinning={phase === 'spinning'}
            onSettled={handleSettled}
          />
          <button
            className="btn"
            onClick={handleSpin}
            disabled={phase === 'spinning'}
          >
            {phase === 'spinning' ? 'Assessing…' : 'Assess my wealth'}
          </button>
          <p className="odds">
            Based on current data, the probability of any given person being a
            billionaire is approximately <strong>1 in {odds}</strong>. Results
            reflect this.
          </p>
        </div>
      )}

      {phase === 'result' && assessment && (
        <div className="card">
          <div className="verdict">
            <span className="verdict-cap">Your assessed net worth</span>
            <span className="verdict-num">${assessment.billions}B</span>
            <span className="verdict-sub">
              Determined on{' '}
              {new Date(assessment.assessedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              . This figure has been retained for your records.
            </span>
          </div>

          <Comparison userBillions={assessment.billions} data={list} />

          <div className="actions">
            <button className="btn ghost" onClick={handleReassess}>
              Request re-assessment
            </button>
          </div>
        </div>
      )}

      <footer className="colophon">
        <p>
          Data:{' '}
          <a
            href="https://github.com/komed3/rtb-api"
            target="_blank"
            rel="noreferrer"
          >
            Real-time Billionaires API
          </a>{' '}
          (komed3), derived from Forbes. Provided without warranty as to your
          financial future. For entertainment purposes; the billionaires'
          figures are real.
        </p>
      </footer>
    </div>
  )
}
