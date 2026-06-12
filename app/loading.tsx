import BeNativeSpinner from '@/components/BeNativeSpinner'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <BeNativeSpinner size={56} />
    </div>
  )
}
