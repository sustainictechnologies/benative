import type { Metadata } from 'next'
import Sidebar from './_components/Sidebar'

export const metadata: Metadata = {
  title: 'Be Native Admin',
  description: 'Be Native — Admin Dashboard',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex bg-stone-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
