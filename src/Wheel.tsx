import { useRef, useState } from 'react'

export interface WheelSegment {
  label: string
  /** Net worth this segment represents, in USD billions. */
  billions: number
  color: string
}

// Deceptively equal-looking slices. The pointer outcome is decided by the
// caller (a statistical roll), not by where the wheel "feels" like stopping.
export const SEGMENTS: WheelSegment[] = [
  { label: '$0B', billions: 0, color: '#1f2733' },
  { label: '$1B', billions: 1, color: '#2a3442' },
  { label: '$10B', billions: 10, color: '#1f2733' },
  { label: '$100B', billions: 100, color: '#2a3442' },
  { label: '$100B+', billions: 250, color: '#1f2733' },
]

const SEG_ANGLE = 360 / SEGMENTS.length

function conicGradient(): string {
  const stops = SEGMENTS.map((s, i) => {
    const start = i * SEG_ANGLE
    const end = (i + 1) * SEG_ANGLE
    return `${s.color} ${start}deg ${end}deg`
  })
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
}

interface WheelProps {
  /** Index of the segment the wheel must stop on. */
  targetIndex: number
  spinning: boolean
  onSettled: () => void
}

export function Wheel({ targetIndex, spinning, onSettled }: WheelProps) {
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const hasSpun = useRef(false)

  // Kick off the spin exactly once when `spinning` flips true.
  if (spinning && !hasSpun.current) {
    hasSpun.current = true
    // Center of the target slice, measured clockwise from the top pointer.
    const segCenter = targetIndex * SEG_ANGLE + SEG_ANGLE / 2
    const fullTurns = 6 * 360
    // Rotate so that the target center ends up under the pointer at 0deg.
    const next = rotationRef.current + fullTurns + (360 - segCenter)
    rotationRef.current = next
    setRotation(next)
  }

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden />
      <div
        className="wheel"
        style={{
          background: conicGradient(),
          transform: `rotate(${rotation}deg)`,
        }}
        onTransitionEnd={() => {
          if (spinning) onSettled()
        }}
      >
        {SEGMENTS.map((s, i) => (
          <span
            key={s.label}
            className="wheel-label"
            style={{
              transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg) translateY(-7.6em)`,
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className="wheel-hub" aria-hidden />
    </div>
  )
}
