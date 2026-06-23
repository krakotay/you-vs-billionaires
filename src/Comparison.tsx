import type { Billionaire, RtbList } from './api'

interface ComparisonProps {
  userBillions: number
  data: RtbList
}

const fmt = (b: number) =>
  `$${b.toLocaleString('en-US', { maximumFractionDigits: 2 })}B`

const signed = (b: number) => {
  const v = `$${Math.abs(b).toLocaleString('en-US', { maximumFractionDigits: 2 })}B`
  return b >= 0 ? `+${v}` : `−${v}`
}

// Deadpan line: your net worth is constant, so the gap to a billionaire moves
// only when theirs does. If they lost money today, your relative position
// "improved" by exactly that amount.
function relativeLine(b: Billionaire, userBillions: number): string {
  const theirChange = b.change.value / 1000 // billions/day
  const rel = -theirChange // your relative gain
  if (Math.abs(rel) < 0.005) {
    return `Your position relative to ${b.name} held steady. So did your $${userBillions}B.`
  }
  if (rel > 0) {
    return `Your net worth relative to ${b.name} grew by ${signed(rel)} today — they lost ${fmt(Math.abs(theirChange))}, while you held firm at ${fmt(userBillions)}.`
  }
  return `Your net worth relative to ${b.name} fell by ${signed(rel)} today — they gained ${fmt(Math.abs(theirChange))}, while you held firm at ${fmt(userBillions)}.`
}

export function Comparison({ userBillions, data }: ComparisonProps) {
  const top = data.list.slice(0, 10)
  const totalBillions = data.total / 1000

  const richerThan = data.list.filter(
    (b) => b.networth / 1000 <= userBillions,
  ).length
  const sharePct = totalBillions > 0 ? (userBillions / totalBillions) * 100 : 0

  // The day's biggest loser — your strongest "performance" of the day.
  const bestRelative = [...top].sort(
    (a, b) => a.change.value - b.change.value,
  )[0]

  return (
    <section className="comparison">
      <h2>Your standing</h2>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-num">{fmt(userBillions)}</span>
          <span className="stat-cap">Assessed net worth</span>
        </div>
        <div className="stat">
          <span className="stat-num">
            {richerThan} / {data.count.toLocaleString('en-US')}
          </span>
          <span className="stat-cap">Billionaires you out-earn</span>
        </div>
        <div className="stat">
          <span className="stat-num">{sharePct.toFixed(8)}%</span>
          <span className="stat-cap">Of all billionaire wealth held by you</span>
        </div>
      </div>

      {bestRelative && bestRelative.change.value < 0 && (
        <p className="headline">
          Today's strongest move: {relativeLine(bestRelative, userBillions)}
        </p>
      )}

      <h3>Daily report — top 10</h3>
      <p className="muted">
        Real-time list as of {data.date}. Values relative to your steady{' '}
        {fmt(userBillions)}.
      </p>

      <ul className="ledger">
        {top.map((b) => {
          const rel = -(b.change.value / 1000)
          return (
            <li key={b.uri}>
              <div className="ledger-main">
                <span className="ledger-rank">#{b.rank}</span>
                <span className="ledger-name">{b.name}</span>
                <span className="ledger-nw">{fmt(b.networth / 1000)}</span>
              </div>
              <div
                className={`ledger-rel ${rel >= 0 ? 'pos' : 'neg'}`}
                title={relativeLine(b, userBillions)}
              >
                You vs. them today: {signed(rel)}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="footnote">
        Methodology: your net worth is held constant at {fmt(userBillions)}.
        Any change in the gap is therefore attributable entirely to the other
        party. Figures are nominal and not adjusted for the indignity of it all.
      </p>
    </section>
  )
}
