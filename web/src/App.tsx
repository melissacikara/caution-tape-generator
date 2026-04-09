import { AppHeader } from './components/AppHeader'
import { TapeCreatorPanel } from './tape'

export default function App() {
  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[480px] md:max-w-[640px]">
          <TapeCreatorPanel />
        </div>
      </main>
    </div>
  )
}
