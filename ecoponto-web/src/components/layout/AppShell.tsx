import Header from './Header'
import Footer from './Footer'

interface AppShellProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export default function AppShell({ children, fullWidth = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#EFF2EF]">
      <Header />
      <main
        className={`flex-1 ${
          fullWidth ? 'w-full' : 'max-w-5xl w-full mx-auto px-4 py-6'
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
