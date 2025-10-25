import { Header } from "@/components/dashboard/header"
import { WorkflowDashboard } from "@/components/dashboard/workflow-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-xl border bg-card">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/10 to-transparent dark:from-blue-400/10" />
          <div className="px-6 py-12 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Accelerate product listings with AI
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Identify items, generate SEO-friendly content, and push draft listings to Shopify — all in one place.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/auth/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg">Sign in</Button>
              </Link>
            </div>
          </div>
        </section>
        <div className="mt-10">
          <WorkflowDashboard />
        </div>
      </main>
    </div>
  )
}
