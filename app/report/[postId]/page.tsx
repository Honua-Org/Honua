"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Flag, AlertTriangle, Shield } from "lucide-react"

const reportReasons = [
  {
    id: "spam",
    label: "Spam",
    description: "Repetitive, unwanted, or irrelevant content",
  },
  {
    id: "harassment",
    label: "Harassment or Bullying",
    description: "Content that targets or intimidates individuals",
  },
  {
    id: "hateful",
    label: "Hateful Content",
    description: "Content that promotes hatred or discrimination",
  },
  {
    id: "misinformation",
    label: "Misinformation",
    description: "False or misleading information",
  },
  {
    id: "malicious",
    label: "Malicious Content",
    description: "Content intended to harm or deceive",
  },
  {
    id: "inappropriate",
    label: "Inappropriate Content",
    description: "Content not suitable for the platform",
  },
  {
    id: "copyright",
    label: "Copyright Violation",
    description: "Unauthorized use of copyrighted material",
  },
  {
    id: "other",
    label: "Other",
    description: "Reason not listed above",
  },
]

export default function ReportPostPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) => (prev.includes(reasonId) ? prev.filter((id) => id !== reasonId) : [...prev, reasonId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedReasons.length === 0) {
      toast({
        title: "Please select a reason",
        description: "You must select at least one reason for reporting this post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Redirect to thank you page
      router.push(`/report/thank-you?postId=${params.postId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Report Post</h1>
          </div>
        </div>

        {/* Warning Notice */}
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Help us keep Honua safe</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Reports are reviewed by our moderation team. False reports may result in action against your account.
                  Only report content that violates our community guidelines.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Why are you reporting this post?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportReasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Checkbox
                    id={reason.id}
                    checked={selectedReasons.includes(reason.id)}
                    onCheckedChange={() => handleReasonToggle(reason.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={reason.id} className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                      {reason.label}
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reason.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Provide any additional context that might help our moderation team understand the issue..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{additionalInfo.length}/500 characters</p>
            </CardContent>
          </Card>

          {/* Selected Reasons Summary */}
          {selectedReasons.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Selected Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedReasons.map((reasonId) => {
                    const reason = reportReasons.find((r) => r.id === reasonId)
                    return (
                      <Badge
                        key={reasonId}
                        variant="secondary"
                        className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      >
                        {reason?.label}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={selectedReasons.length === 0 || isSubmitting}>
              {isSubmitting ? "Submitting Report..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
