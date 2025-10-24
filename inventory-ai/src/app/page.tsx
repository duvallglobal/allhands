import { Header } from "@/components/dashboard/header"
import { WorkflowDashboard } from "@/components/dashboard/workflow-dashboard"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <WorkflowDashboard />
      </main>
    </div>
  )
}
