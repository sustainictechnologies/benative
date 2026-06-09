interface Props {
  height?: number
  markOnly?: boolean
  color?: string
}

const COLOR = '#2d4520'

export default function BeNativeLogo({ height = 64, markOnly = false, color = COLOR }: Props) {
  if (markOnly) {
    return (
      <svg
        viewBox="0 0 100 100"
        height={height}
        width={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BeNative"
      >
        <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="6" />
        <circle cx="72" cy="62" r="10" fill={color} />
      </svg>
    )
  }

  /* viewBox wide enough to fit tagline with letter-spacing */
  const vw = 320
  const vh = 222
  const cx = vw / 2  // 160

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      height={height}
      width={Math.round((vw / vh) * height)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BeNative — Travel Beyond the Guidebook"
    >
      {/* Circle mark */}
      <circle cx={cx} cy="60" r="48" stroke={color} strokeWidth="7" />
      <circle cx={cx + 28} cy="76" r="11" fill={color} />

      {/* BeNative */}
      <text
        x={cx}
        y="142"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="400"
        fontSize="40"
        fill={color}
      >
        BeNative
      </text>

      {/* Tagline */}
      <text
        x={cx}
        y="172"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="400"
        fontSize="14"
        fill={color}
        letterSpacing="2"
      >
        TRAVEL BEYOND THE GUIDEBOOK
      </text>
    </svg>
  )
}
