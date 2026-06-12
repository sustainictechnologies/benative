export default function BeNativeSpinner({ size = 56 }: { size?: number }) {
  const dotSize = Math.round(size * 0.2)
  const orbitRadius = (size / 2) * 0.6
  const dotTop = size / 2 - orbitRadius - dotSize / 2
  const dotLeft = size / 2 - dotSize / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Static ring — matches logo circle */}
      <div className="absolute inset-0 rounded-full border-[3px] border-brand-300" />
      {/* Dot orbiting inside the ring */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.2s' }}>
        <div
          className="absolute rounded-full bg-brand-600"
          style={{ width: dotSize, height: dotSize, top: dotTop, left: dotLeft }}
        />
      </div>
    </div>
  )
}
