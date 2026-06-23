// Thin client for the Real-time Billionaires API (komed3/rtb-api), served via Statically.
// Net worth and change values from the API are expressed in MILLIONS of USD.

const LIVE_BASE = 'https://cdn.statically.io/gh/komed3/rtb-api/main/api'
const STABLE_BASE = 'https://cdn.statically.io/gh/komed3/rtb-api@v1/api'

export const WORLD_POPULATION = 8_300_000_000

export interface Billionaire {
  rank: number
  uri: string
  name: string
  gender: string
  age: number | null
  networth: number // millions USD
  change: {
    value: number // millions USD, daily
    pct: number
    date: string
  }
  citizenship: string
  industry: string[]
  source: string[]
}

export interface RtbList {
  date: string
  count: number
  woman: number
  total: number // millions USD
  list: Billionaire[]
}

// Same fallback-first strategy as the Gemini implementation: the application
// remains usable while the live CDN feed is slow or unavailable.
export const FALLBACK_LIST: RtbList = {
  date: 'local fallback',
  count: 2781,
  woman: 0,
  total: 14_200_000,
  list: [
    ['Elon Musk', 'elon-musk', 210_200, -4_500, 'us', 'Tesla, SpaceX', 'automotive'],
    ['Jeff Bezos', 'jeff-bezos', 201_500, 1_200, 'us', 'Amazon', 'technology'],
    ['Bernard Arnault & family', 'bernard-arnault', 195_400, -2_100, 'fr', 'LVMH', 'fashion-retail'],
    ['Mark Zuckerberg', 'mark-zuckerberg', 178_600, 3_400, 'us', 'Meta', 'technology'],
    ['Larry Ellison', 'larry-ellison', 152_300, 600, 'us', 'Oracle', 'technology'],
    ['Warren Buffett', 'warren-buffett', 136_200, -300, 'us', 'Berkshire Hathaway', 'finance-investments'],
    ['Bill Gates', 'bill-gates', 131_500, -100, 'us', 'Microsoft', 'technology'],
    ['Larry Page', 'larry-page', 128_400, 1_800, 'us', 'Google', 'technology'],
    ['Steve Ballmer', 'steve-ballmer', 124_900, 200, 'us', 'Microsoft', 'technology'],
    ['Sergey Brin', 'sergey-brin', 123_100, 1_700, 'us', 'Google', 'technology'],
  ].map(([name, uri, networth, change, citizenship, source, industry], index) => ({
    rank: index + 1,
    name: name as string,
    uri: uri as string,
    gender: 'm',
    age: null,
    networth: networth as number,
    change: {
      value: change as number,
      pct: 0,
      date: 'local fallback',
    },
    citizenship: citizenship as string,
    source: [source as string],
    industry: [industry as string],
  })),
}

async function getJSON<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}/${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function getText(base: string, path: string): Promise<string> {
  const res = await fetch(`${base}/${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.text()
}

/** Latest available real-time list (date, totals, ranked people). */
export function fetchLatestList(): Promise<RtbList> {
  return getJSON<RtbList>(LIVE_BASE, 'list/rtb/latest')
}

/**
 * Current global headcount of billionaires, parsed from the daily count CSV
 * (rows: "YYYY-MM-DD<TAB>count"). Returns the most recent value.
 */
export async function fetchBillionaireCount(): Promise<number> {
  const csv = await getText(STABLE_BASE, 'stats/count')
  const rows = csv.trim().split('\n')
  for (let i = rows.length - 1; i >= 0; i--) {
    const parts = rows[i].trim().split(/[\s,]+/)
    const n = Number(parts[parts.length - 1])
    if (Number.isFinite(n) && n > 0) return n
  }
  throw new Error('Could not parse billionaire count')
}
