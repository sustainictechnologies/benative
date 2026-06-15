import type { Metadata } from 'next'
import Sidebar from './_components/Sidebar'
import AdminSessionGuard from './_components/AdminSessionGuard'

export const metadata: Metadata = {
  title: 'BeNative Admin',
  description: 'BeNative — Admin Dashboard',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex bg-stone-50 overflow-hidden">
      <AdminSessionGuard />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
