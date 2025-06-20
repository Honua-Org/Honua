"use client"

import { useSearchParams, useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Home, ArrowLeft } from "lucide-react"

export default function ReportThankYouPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const postId = searchParams.get("postId")

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Thank You for Your Report</h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                We've received your report and our moderation team will review it as soon as possible. We take all
                reports seriously and will take appropriate action if the content violates our community guidelines.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What happens next?</strong>
                  <br />
                  Our team typically reviews reports within 24-48 hours. You'll receive a notification if any action is
                  taken on the reported content.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={() => router.push("/")} className="w-full sustainability-gradient">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>

                <Button variant="outline" onClick={() => router.back()} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>

              {postId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                  Report ID: {postId}-{Date.now()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
