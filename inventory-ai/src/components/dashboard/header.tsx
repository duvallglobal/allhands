"use client"

import { SignInButton } from "@/components/auth/signin-button"
import { Package } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold">Inventory AI</h1>
        </div>
        <SignInButton />
      </div>
    </header>
  )
}