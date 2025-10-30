"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function SignupPageContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    username: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [inviterProfile, setInviterProfile] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Check for referral code in URL parameters
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
      // Fetch inviter profile for display
      fetchInviterProfile(ref)
    }
  }, [searchParams])

  const acceptInvite = async (newUserId: string, inviteCode: string) => {
    try {
      // Use the invite acceptance API
      const response = await fetch(`/api/invites/accept/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error accepting invite:', data.error)
        return false
      }
      
      console.log('Invite accepted successfully:', data.message)
      return true
    } catch (error) {
      console.error('Error accepting invite:', error)
      return false
    }
  }

  const fetchInviterProfile = async (code: string) => {
    try {
      // Use the invite validation API to get inviter info
      const response = await fetch(`/api/invites/validate/${code}`)
      const data = await response.json()
      
      if (response.ok && !data.error && !data.is_used) {
        setInviterProfile({
          username: data.inviter_username,
          full_name: data.inviter_name,
          avatar_url: data.inviter_avatar
        })
      }
    } catch (err) {
      console.error('Error fetching inviter profile:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .single()
      
      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
          },
        },
      })

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        // For confirmed users (no email verification required), create profile immediately
        const user = signUpData?.user
        if (user && user.email_confirmed_at) {
          try {
            const { error: profileError } = await supabase.from('profiles').insert({
              id: user.id,
              full_name: formData.fullName,
              username: formData.username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            if (profileError) {
              console.error('Profile creation error:', profileError)
              toast({
                title: "Profile creation failed",
                description: "Account created but profile setup failed. Please contact support.",
                variant: "destructive",
              })
            } else {
              // Accept invite if present
              if (referralCode) {
                await acceptInvite(user.id, referralCode)
              }
              
              toast({
                title: "Welcome to Honua!",
                description: referralCode ? "Your account has been created successfully! Your inviter will receive bonus points." : "Your account has been created successfully.",
              })
              router.push("/")
              return
            }
          } catch (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }
        
        // For users requiring email verification
        // Store referral code in user metadata for later processing
        if (referralCode && user) {
          await supabase.auth.updateUser({
            data: { referral_code: referralCode }
          })
        }
        
        toast({
          title: "Welcome to Honua!",
          description: "Please check your email to verify your account. Your profile will be created after verification.",
        })
        router.push("/auth/verify-email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: referralCode ? {
          state: referralCode
        } : undefined,
      },
    })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8 px-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Image src="/images/honua-logo.svg" alt="Honua Logo" width={40} height={40} className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">Honua</h1>
          <p className="text-sm sm:text-base text-green-600 dark:text-green-400">Join the sustainability movement</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mx-2 sm:mx-0">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Join Honua and connect with like-minded sustainability advocates
            </CardDescription>
            
            {inviterProfile && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{inviterProfile.full_name}</span> invited you to join Honua!
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="pl-10 h-11 sm:h-10 text-base sm:text-sm rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="h-11 sm:h-10 text-base sm:text-sm px-4 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 sm:h-10 text-base sm:text-sm rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-12 h-11 sm:h-10 text-base sm:text-sm rounded-lg"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-12 h-11 sm:h-10 text-base sm:text-sm rounded-lg"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3 py-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  required
                  className="mt-1 min-w-[20px] min-h-[20px]"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-green-600 hover:text-green-700 underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-green-600 hover:text-green-700 underline font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full sustainability-gradient h-12 sm:h-10 text-base sm:text-sm font-medium rounded-lg" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-12 sm:h-10 text-base sm:text-sm rounded-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleGoogleSignup}>
              <svg className="mr-3 h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center text-sm text-muted-foreground px-4 py-2">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 underline font-medium text-base sm:text-sm">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
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
      <SignupPageContent />
    </Suspense>
  )
}
