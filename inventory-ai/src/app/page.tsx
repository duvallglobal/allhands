import { Header } from "@/components/dashboard/header"
import { EnhancedDashboard } from "@/components/dashboard/enhanced-dashboard"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <EnhancedDashboard />
      </main>
    </div>
  )
}
