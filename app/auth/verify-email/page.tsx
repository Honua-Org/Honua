"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function VerifyEmailPageContent() {
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const email = searchParams.get("email") || "your email"

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Email sent!",
          description: "Please check your inbox for the verification link",
        })
        setResendCooldown(60) // 60 second cooldown
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Image src="/images/honua-logo.svg" alt="Honua Logo" width={40} height={40} className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Honua</h1>
          <p className="text-green-600 dark:text-green-400">Sustainability Social Platform</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-1">Click the verification link</p>
                  <p className="text-green-700 dark:text-green-300">
                    Open the email and click the verification link to activate your account
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Check your spam folder</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Sometimes verification emails end up in spam or junk folders
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Didn't receive the email?</p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend verification email
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Wrong email address?{" "}
                  <Link
                    href="/auth/signup"
                    className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium"
                  >
                    Sign up again
                  </Link>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Already verified?{" "}
                  <Link
                    href="/auth/login"
                    className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{" "}
            <Link href="/support" className="text-green-600 hover:text-green-500 dark:text-green-400">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <Image src="/images/honua-logo.svg" alt="Honua Logo" width={40} height={40} className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Honua</h1>
            <p className="text-green-600 dark:text-green-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
