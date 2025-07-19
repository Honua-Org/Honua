"use client"

import { useState } from "react"
import MentionTextarea from "@/components/mention-textarea"
import { renderContentWithLinksAndMentions } from "@/lib/mention-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestMentionsPage() {
  const [content, setContent] = useState("")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Mention Functionality</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Area</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Type @ followed by a username (e.g., @afrotechboss) to test the mention functionality.
            </p>
            <MentionTextarea
              value={content}
              onChange={setContent}
              placeholder="Type your message here... Try typing @afrotechboss"
              minHeight="120px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendered Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[100px]">
              {content ? (
                <div className="whitespace-pre-wrap">
                  {renderContentWithLinksAndMentions(content)}
                </div>
              ) : (
                <p className="text-gray-500 italic">Your rendered content will appear here...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Content Length:</strong> {content.length}</p>
              <p><strong>Raw Content:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{content || "(empty)"}</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}