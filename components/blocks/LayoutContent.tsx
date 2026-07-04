import Image from 'next/image'

interface LayoutCell {
  id: string
  type: 'text' | 'image' | 'list' | 'empty'
}

interface LayoutRow {
  id: string
  cols: 1 | 2 | 3
  cells: LayoutCell[]
}

interface LayoutData {
  rows:   LayoutRow[]
  cells:  Record<string, string>
  images: Record<string, string>
}

interface Props {
  layout?: LayoutData | null
}

const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

const BULLET_STYLE: Record<string, (i: number) => React.ReactNode> = {
  dash:   ()  => <span className="text-stone-400 shrink-0 text-xs">—</span>,
  number: (i) => <span className="text-xs text-stone-500 font-mono shrink-0 min-w-[14px]">{i + 1}.</span>,
  check:  ()  => <span className="text-green-500 shrink-0 text-xs">✓</span>,
  arrow:  ()  => <span className="text-brand-500 shrink-0 text-xs">→</span>,
  square: ()  => <span className="w-2 h-2 bg-stone-500 shrink-0 inline-block mt-1" />,
  dot:    ()  => <span className="w-1.5 h-1.5 bg-stone-400 rounded-full shrink-0 inline-block mt-1.5" />,
}

function TextCell({ content, cellId, cells }: { content: string; cellId: string; cells: Record<string, string> }) {
  const font   = cells[`${cellId}-font`]
  const size   = cells[`${cellId}-size`]
  const color  = cells[`${cellId}-color`]
  const bold   = cells[`${cellId}-bold`]   === 'true'
  const italic = cells[`${cellId}-italic`] === 'true'
  const align  = cells[`${cellId}-align`]  as React.CSSProperties['textAlign'] | undefined

  const style: React.CSSProperties = {
    ...(font   ? { fontFamily: font }       : {}),
    ...(size   ? { fontSize: `${size}px` } : {}),
    ...(color  ? { color }                  : {}),
    ...(bold   ? { fontWeight: 'bold' }    : {}),
    ...(italic ? { fontStyle: 'italic' }   : {}),
    ...(align  ? { textAlign: align }      : {}),
  }

  return (
    <div className="space-y-2">
      {(content ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
        <p key={i} className="text-sm text-stone-600 leading-relaxed" style={style}>{para}</p>
      ))}
    </div>
  )
}

function ImageCell({ url, cellId, cells }: { url: string; cellId: string; cells: Record<string, string> }) {
  const fit = (cells[`${cellId}-fit`] ?? 'cover') as 'cover' | 'contain'
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <Image src={url} alt="" fill className={`object-${fit}`} sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
  )
}

function ListCell({ cellId, cells }: { cellId: string; cells: Record<string, string> }) {
  let items: string[] = []
  try { items = JSON.parse(cells[`${cellId}-items`] ?? '[]') } catch {}

  const bulletStyle = cells[`${cellId}-bullet`] ?? 'dot'
  const getBullet   = BULLET_STYLE[bulletStyle] ?? BULLET_STYLE.dot

  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
          {getBullet(i)}
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LayoutContent({ layout }: Props) {
  if (!layout?.rows?.length) return null

  return (
    <div className="space-y-4 mt-4">
      {layout.rows.map((row) => (
        <div key={row.id} className={`grid gap-4 ${COL_CLASS[row.cols] ?? 'grid-cols-1'}`}>
          {row.cells.map((cell) => {
            if (cell.type === 'empty') return null

            const textContent  = layout.cells[cell.id]
            const imageUrl     = layout.images[cell.id]

            if (cell.type === 'text' && textContent) {
              return <TextCell key={cell.id} content={textContent} cellId={cell.id} cells={layout.cells} />
            }
            if (cell.type === 'image' && imageUrl) {
              return <ImageCell key={cell.id} url={imageUrl} cellId={cell.id} cells={layout.cells} />
            }
            if (cell.type === 'list') {
              return <ListCell key={cell.id} cellId={cell.id} cells={layout.cells} />
            }
            return null
          })}
        </div>
      ))}
    </div>
  )
}