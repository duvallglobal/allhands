"use client"

import Link from "next/link"
import { SignInButton } from "@/components/auth/signin-button"
import { Button } from "@/components/ui/button"
import { Package, Brain, Home } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold">Inventory AI</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/gemini-demo">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Gemini AI Demo
              </Button>
            </Link>
          </nav>
        </div>
        <SignInButton />
      </div>
    </header>
  )
}