interface Props {
  subCategories: string[]   // labels of the Discover sub-categories ticked for the homestay
  facilities:    string[]   // names of its facility (spec_*) tags
}

// The homestay's tags, placed where the builder's Tags block is (or below the gallery when there is none)
export default function TagsBlock({ subCategories, facilities }: Props) {
  if (subCategories.length === 0 && facilities.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {subCategories.map((label) => (
        <span key={label} className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
          {label}
        </span>
      ))}
      {facilities.map((label) => (
        <span key={label} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
          {label}
        </span>
      ))}
    </div>
  )
}
