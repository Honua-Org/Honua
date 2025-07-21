"use client"

import React, { useState } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { renderContentWithLinksAndMentions } from "@/lib/mention-utils"

export default function TestHashtagsPage() {
  const [content, setContent] = useState(
    "Check out these amazing #SolarEnergy innovations! 🌞 The future is bright with #RenewableEnergy and #ClimateAction. Let's work together for #SustainableLiving! #ZeroWaste #GreenTech"
  )
  const [displayContent, setDisplayContent] = useState(content)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setDisplayContent(newContent)
  }

  const handleRender = () => {
    setDisplayContent(content)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Hashtag Functionality Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the hashtag parsing and rendering functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Input Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Type content with hashtags like #SolarEnergy #ClimateAction..."
                className="min-h-[200px] resize-none"
              />
              <Button onClick={handleRender} className="w-full">
                Render Content
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Rendered Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {renderContentWithLinksAndMentions(displayContent)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Test Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Example 1: Multiple Hashtags</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                {renderContentWithLinksAndMentions(
                  "Excited about #SolarEnergy and #WindPower! These #RenewableEnergy sources are the future. #ClimateAction #Sustainability"
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Example 2: Mixed Content</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                {renderContentWithLinksAndMentions(
                  "Check out https://example.com for more info on #GreenTech! @john_doe is leading the #Innovation in #SustainableLiving."
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Example 3: Hashtags with Numbers</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                {renderContentWithLinksAndMentions(
                  "Join us for #COP28 and #2030Goals! The #SDG2030 initiative is crucial for our planet's future. #ClimateChange2024"
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}