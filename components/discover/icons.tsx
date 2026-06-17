interface IconProps {
  className?: string
}

const base = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ─── Travel Intent Icons (Layer 1) ───────────────────────────────────────────

export function NatureHabitatsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Left wing */}
      <path d="M6 26 C14 18 24 20 30 28" />
      {/* Right wing */}
      <path d="M30 28 C38 20 48 14 58 18" />
      {/* Left wing under-feathers */}
      <path d="M8 30 C16 28 24 30 30 28" />
      {/* Body curving down */}
      <path d="M30 28 C28 36 24 44 18 50" />
      {/* Tail split */}
      <path d="M18 50 C14 54 10 58 8 60" />
      <path d="M18 50 C16 56 12 60 10 62" />
      {/* Neck up */}
      <path d="M30 28 C32 22 34 18 38 16" />
      {/* Head */}
      <circle cx="40" cy="14" r="3.5" fill="currentColor" stroke="none" />
      {/* Long beak */}
      <path d="M43 13 L54 9" />
      {/* Leg trailing */}
      <path d="M24 40 L24 52 M20 56 L24 52 L28 56" />
    </svg>
  )
}

export function RuralImmersionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* House walls */}
      <rect x="12" y="30" width="30" height="22" rx="1" />
      {/* Roof */}
      <path d="M8 30 L27 8 L46 30" />
      {/* Door */}
      <path d="M22 52 L22 40 Q27 37 32 40 L32 52" />
      {/* Window */}
      <rect x="14" y="36" width="6" height="6" rx="0.5" />
      {/* Chimney */}
      <path d="M36 14 L36 6 L40 6 L40 18" />
      {/* Smoke */}
      <path d="M37 4 C36 2 38 0 37 -2" strokeDasharray="1 2" />
      {/* Person standing */}
      <circle cx="52" cy="34" r="4" />
      <path d="M52 38 L52 48" />
      <path d="M46 42 L52 40 L58 42" />
      <path d="M52 48 L49 54 M52 48 L55 54" />
    </svg>
  )
}

export function LongStayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Head */}
      <circle cx="32" cy="14" r="7" />
      {/* Torso */}
      <path d="M24 24 C22 30 22 36 24 42 L40 42 C42 36 42 30 40 24" />
      {/* Left leg crossing */}
      <path d="M24 42 C18 42 12 44 10 50 C14 54 22 54 28 50" />
      {/* Right leg crossing */}
      <path d="M40 42 C46 42 52 44 54 50 C50 54 42 54 36 50" />
      {/* Feet resting on opposite knees */}
      <path d="M10 50 C12 56 20 58 28 54" />
      <path d="M54 50 C52 56 44 58 36 54" />
      {/* Arms resting on knees */}
      <path d="M24 30 C18 36 12 42 10 50" />
      <path d="M40 30 C46 36 52 42 54 50" />
    </svg>
  )
}

export function OnTheMoveIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Rear wheel */}
      <circle cx="18" cy="46" r="12" />
      {/* Front wheel */}
      <circle cx="46" cy="46" r="12" />
      {/* Rear hub */}
      <circle cx="18" cy="46" r="2" fill="currentColor" stroke="none" />
      {/* Front hub */}
      <circle cx="46" cy="46" r="2" fill="currentColor" stroke="none" />
      {/* Frame: rear axle → seat → pedal → front fork */}
      <path d="M18 46 L28 28 L38 36 L46 46" />
      {/* Chain stay */}
      <path d="M18 46 L38 36" />
      {/* Seat tube */}
      <path d="M28 28 L32 22" />
      {/* Seat */}
      <path d="M28 22 L36 22" />
      {/* Handlebar stem */}
      <path d="M46 34 L46 28" />
      {/* Handlebar */}
      <path d="M42 28 L50 28" />
      {/* Rider head */}
      <circle cx="34" cy="16" r="5" />
      {/* Rider body */}
      <path d="M34 21 C32 25 30 28 28 28" />
      {/* Rider arm to handlebar */}
      <path d="M32 24 L46 30" />
    </svg>
  )
}

// ─── Landscape Icons (Layer 2) ────────────────────────────────────────────────

export function ForestBordersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Trunk */}
      <path d="M32 58 L32 40" />
      {/* Bottom tier */}
      <path d="M12 40 L32 18 L52 40" />
      {/* Middle tier */}
      <path d="M16 32 L32 12 L48 32" />
      {/* Top tier */}
      <path d="M22 24 L32 6 L42 24" />
      {/* Root spread */}
      <path d="M26 58 L38 58" />
      {/* Branch detail lines */}
      <path d="M24 40 L20 44" strokeOpacity="0.5" />
      <path d="M40 40 L44 44" strokeOpacity="0.5" />
    </svg>
  )
}

export function RiversideIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Water waves — 3 layers */}
      <path d="M6 22 C14 16 22 28 30 22 C38 16 46 28 58 22" />
      <path d="M6 34 C14 28 22 40 30 34 C38 28 46 40 58 34" />
      <path d="M6 46 C14 40 22 52 30 46 C38 40 46 52 58 46" />
      {/* Boat on top wave */}
      <path d="M24 22 L26 14 C28 12 34 12 36 14 L38 22 Z" />
      {/* Mast */}
      <path d="M32 22 L32 6" />
      {/* Sail */}
      <path d="M32 8 L40 14 L32 18" />
    </svg>
  )
}

export function CoastalVillagesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Palm trunk — curved */}
      <path d="M24 58 C26 50 30 40 36 30 C38 26 40 22 42 18" />
      {/* Frond right */}
      <path d="M42 18 C50 12 56 14 56 20" />
      {/* Frond upper right */}
      <path d="M42 18 C48 10 46 4 40 6" />
      {/* Frond upper left */}
      <path d="M42 18 C36 10 30 10 28 14" />
      {/* Frond left */}
      <path d="M42 18 C34 16 26 20 24 26" />
      {/* Coconuts cluster */}
      <circle cx="42" cy="20" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="38" cy="18" r="2" fill="currentColor" stroke="none" />
      <circle cx="44" cy="16" r="1.8" fill="currentColor" stroke="none" />
      {/* Water waves */}
      <path d="M6 50 C14 46 22 54 30 50 C38 46 46 54 58 50" />
      <path d="M6 56 C14 52 22 60 30 56 C38 52 46 60 58 56" />
    </svg>
  )
}

export function MountainPassIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Left mountain */}
      <path d="M4 54 L22 18 L32 38 L40 20 L58 54" />
      {/* Snow cap — left peak */}
      <path d="M18 26 L22 18 L26 26" />
      {/* Snow cap — right peak */}
      <path d="M36 28 L40 20 L44 28" />
      {/* Pass/valley path winding through */}
      <path d="M28 44 C32 40 36 42 40 38" strokeDasharray="3 2" strokeOpacity="0.7" />
      {/* Ground */}
      <path d="M4 54 L58 54" strokeOpacity="0.3" />
      {/* Rock detail on left face */}
      <path d="M14 38 L18 38" strokeOpacity="0.4" />
      <path d="M10 46 L14 46" strokeOpacity="0.4" />
    </svg>
  )
}

export function FarmBeltsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Curved field rows (aerial view — contour farming) */}
      <path d="M8 50 C20 46 44 46 56 50" />
      <path d="M8 42 C20 38 44 38 56 42" />
      <path d="M8 34 C20 30 44 30 56 34" />
      <path d="M10 26 C20 22 44 22 54 26" />
      {/* Plant sprouts along top row */}
      <path d="M18 22 L18 14 C16 10 20 10 18 14" />
      <path d="M26 22 L26 12 C24 8 28 8 26 12" />
      <path d="M34 22 L34 10 C32 6 36 6 34 10" />
      <path d="M42 22 L42 12 C40 8 44 8 42 12" />
      <path d="M50 22 L50 14 C48 10 52 10 50 14" />
    </svg>
  )
}

export function RockyPlateauIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Plateau top (flat mesa) */}
      <path d="M14 22 L50 22" />
      {/* Left cliff */}
      <path d="M14 22 L8 38 L6 54" />
      {/* Right cliff */}
      <path d="M50 22 L56 38 L58 54" />
      {/* Ground */}
      <path d="M6 54 L58 54" />
      {/* Rock strata lines on left face */}
      <path d="M12 30 L16 30" strokeOpacity="0.5" />
      <path d="M10 38 L14 38" strokeOpacity="0.5" />
      <path d="M8 46 L12 46" strokeOpacity="0.5" />
      {/* Rock strata right face */}
      <path d="M50 30 L54 30" strokeOpacity="0.5" />
      <path d="M50 38 L54 38" strokeOpacity="0.5" />
      <path d="M52 46 L56 46" strokeOpacity="0.5" />
      {/* Top surface cracks */}
      <path d="M22 22 L26 16 L30 22" strokeOpacity="0.35" />
      <path d="M38 22 L40 16 L44 22" strokeOpacity="0.35" />
    </svg>
  )
}

export function SacredGrovesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Center tree — tallest */}
      <path d="M32 58 L32 36" />
      <path d="M20 44 L32 18 L44 44" />
      <path d="M22 36 L32 12 L42 36" />
      {/* Left tree */}
      <path d="M14 58 L14 40" />
      <path d="M6 48 L14 30 L22 48" />
      {/* Right tree */}
      <path d="M50 58 L50 40" />
      <path d="M42 48 L50 30 L58 48" />
      {/* Ground arc connecting roots */}
      <path d="M6 58 C18 54 46 54 58 58" />
    </svg>
  )
}

export function WetlandFringesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Reed stalks */}
      <path d="M16 54 L16 24" />
      <path d="M30 54 L30 16" />
      <path d="M44 54 L44 26" />
      {/* Cattail heads (filled ellipses) */}
      <ellipse cx="16" cy="20" rx="4" ry="8" fill="currentColor" strokeWidth="0" />
      <ellipse cx="30" cy="12" rx="4" ry="8" fill="currentColor" strokeWidth="0" />
      <ellipse cx="44" cy="22" rx="4" ry="8" fill="currentColor" strokeWidth="0" />
      {/* Seed tuft tips */}
      <path d="M16 12 L16 6" />
      <path d="M30 4 L30 -2" />
      <path d="M44 14 L44 8" />
      {/* Water waves at base */}
      <path d="M6 48 C14 44 22 52 30 48 C38 44 46 52 58 48" />
      <path d="M6 54 C14 50 22 58 30 54 C38 50 46 58 58 54" />
    </svg>
  )
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const SKETCH_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  // Layer 1 — new slugs
  'nature_habitat':    NatureHabitatsIcon,
  'rural_immersion':   RuralImmersionIcon,
  'long_stay_retreat': LongStayIcon,
  'transit_pitstop':   OnTheMoveIcon,
  // Layer 2 — new slugs
  'env_forest_border':   ForestBordersIcon,
  'env_riverside':       RiversideIcon,
  'env_coastal':         CoastalVillagesIcon,
  'env_mountain_valley': MountainPassIcon,
  'env_agricultural':    FarmBeltsIcon,
  'env_rocky_plateau':   RockyPlateauIcon,
  'env_sacred_grove':    SacredGrovesIcon,
  'env_wetland':         WetlandFringesIcon,
  // Legacy slugs (backward compat)
  'nature-habitats':              NatureHabitatsIcon,
  'rural-immersion':              RuralImmersionIcon,
  'long-stay-retreats':           LongStayIcon,
  'on-the-move-transit':          OnTheMoveIcon,
  'forest-borders':               ForestBordersIcon,
  'riverside-backwaters':         RiversideIcon,
  'untouched-coastal-villages':   CoastalVillagesIcon,
  'mountain-passes-high-valleys': MountainPassIcon,
  'active-farm-belts':            FarmBeltsIcon,
  'rocky-plateaus':               RockyPlateauIcon,
  'sacred-groves':                SacredGrovesIcon,
  'wetland-fringes':              WetlandFringesIcon,
}

export function SketchIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = SKETCH_ICONS[slug] ?? ForestBordersIcon
  return <Icon className={className} />
}
