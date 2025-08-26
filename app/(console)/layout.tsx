import Toolbar from '@/components/toolbar'

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}