"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User } from "lucide-react"

export function SignInButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button variant="ghost" disabled>
        <User className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          {session.user?.name || session.user?.email}
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => signIn("google")}
      className="bg-primary hover:bg-primary/90"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Sign in with Google
    </Button>
  )
}