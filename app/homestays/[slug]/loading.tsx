import BeNativeSpinner from '@/components/BeNativeSpinner'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <BeNativeSpinner size={56} />
    </div>
  )
}
