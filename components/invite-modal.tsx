"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Users, Trophy, Check } from "lucide-react"
import { toast } from "sonner"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

interface InviteStats {
  invitedCount: number
  rank: number
  totalUsers: number
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [inviteLink, setInviteLink] = useState("")
  const [inviteLinks, setInviteLinks] = useState<string[]>([])
  const [inviteStats, setInviteStats] = useState<InviteStats>({ invitedCount: 0, rank: 0, totalUsers: 0 })
  const [copied, setCopied] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const session = useSession()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      generateInviteLink()
      fetchInviteStats()
    }
  }, [isOpen, session?.user?.id])

  const generateInviteLink = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const baseUrl = window.location.origin
        setInviteLink(`${baseUrl}/invite/${data.inviteCode}`)
      }
    } catch (error) {
      console.error('Error generating invite link:', error)
      toast.error('Failed to generate invite link')
    }
  }

  const generateBulkInviteLinks = async () => {
    if (!session?.user?.id) return

    try {
      setBulkGenerating(true)
      const response = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bulk: true })
      })

      if (response.ok) {
        const data = await response.json()
        const baseUrl = window.location.origin
        const links = data.inviteCodes.map((code: string) => `${baseUrl}/invite/${code}`)
        setInviteLinks(links)
        toast.success('Generated 5 invite links successfully!')
      }
    } catch (error) {
      console.error('Error generating bulk invite links:', error)
      toast.error('Failed to generate bulk invite links')
    } finally {
      setBulkGenerating(false)
    }
  }

  const fetchInviteStats = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/invites/stats')
      
      if (response.ok) {
        const data = await response.json()
        setInviteStats(data)
      }
    } catch (error) {
      console.error('Error fetching invite stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (link?: string, index?: number) => {
    try {
      const linkToCopy = link || inviteLink
      await navigator.clipboard.writeText(linkToCopy)
      if (index !== undefined) {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy invite link')
    }
  }

  const copyAllLinks = async () => {
    try {
      const allLinks = inviteLinks.join('\n')
      await navigator.clipboard.writeText(allLinks)
      toast.success('All invite links copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy all links:', error)
      toast.error('Failed to copy all links')
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return "bg-yellow-500 text-yellow-50"
    if (rank <= 10) return "bg-green-500 text-green-50"
    return "bg-blue-500 text-blue-50"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Invite Friends to Honua
          </DialogTitle>
          <DialogDescription>
            Share your invite link and climb the leaderboard!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invite Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Invite Link</label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1"
                placeholder="Generating invite link..."
              />
              <Button
                onClick={() => copyToClipboard()}
                variant="outline"
                size="icon"
                disabled={!inviteLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bulk Generation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Generate Multiple Links</label>
              <Button
                onClick={generateBulkInviteLinks}
                disabled={bulkGenerating}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {bulkGenerating ? "Generating..." : "Generate 5 Links"}
              </Button>
            </div>
            
            {inviteLinks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {inviteLinks.length} links generated
                  </span>
                  <Button
                    onClick={copyAllLinks}
                    variant="outline"
                    size="sm"
                  >
                    Copy All
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {inviteLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={link}
                        readOnly
                        className="flex-1 text-xs"
                      />
                      <Button
                        onClick={() => copyToClipboard(link, index)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? "..." : inviteStats.invitedCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Users Invited
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? "..." : `#${inviteStats.rank}`}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Leaderboard Rank
              </div>
            </div>
          </div>

          {/* Rank Badge */}
          {!loading && inviteStats.rank > 0 && (
            <div className="flex justify-center">
              <Badge className={`${getRankBadgeColor(inviteStats.rank)} px-3 py-1`}>
                {inviteStats.rank <= 3 && "🏆 "}
                {inviteStats.rank <= 10 ? "Top 10 Inviter" : "Active Inviter"}
              </Badge>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Share your unique invite link with friends</li>
              <li>• Climb the leaderboard by inviting more users</li>
              <li>• Top inviters get special recognition and rewards!</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}