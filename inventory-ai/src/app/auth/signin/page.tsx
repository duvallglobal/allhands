"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LogIn, Mail, Lock, Loader2 } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") || "/"

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl,
      })
      // result is handled by redirect
    } catch (err) {
      console.error("Sign-in error", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { redirect: true, callbackUrl })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in with Email
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Google
                </>
              )}
            </Button>

            {/* Direct link alternative for Google sign-in */}
            <p className="text-sm text-center">
              Prefer a link? {" "}
              <a
                href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="underline text-primary hover:text-primary/80"
              >
                Sign in with Google
              </a>
            </p>

            <p className="text-sm text-muted-foreground text-center">
              Don’t have an account? {" "}
              <Link href="/auth/register" className="underline hover:text-foreground">Create one</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}