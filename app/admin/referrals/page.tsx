'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Users, UserPlus, AlertTriangle } from 'lucide-react'

interface ReferralStatus {
  totalUsers: number
  usersWithReferralCodes: number
  existingReferrals: number
  potentialMissingReferrals: number
  usersWithCodes: Array<{
    id: string
    email: string
    referralCode: string
    createdAt: string
  }>
}

interface FixResult {
  success: boolean
  summary: {
    totalUsers: number
    usersWithReferralCodes: number
    referralsCreated: number
    referralsSkipped: number
    errors: number
  }
  details: Array<{
    userId: string
    email: string
    referralCode: string
    result: {
      success: boolean
      message: string
      skipped?: boolean
      error?: string
    }
  }>
}

export default function AdminReferralsPage() {
  const [status, setStatus] = useState<ReferralStatus | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)

  const checkReferralStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-referrals')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error checking referral status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixReferrals = async () => {
    setFixing(true)
    try {
      const response = await fetch('/api/fix-referrals', {
        method: 'POST'
      })
      const data = await response.json()
      setFixResult(data)
      // Refresh status after fixing
      await checkReferralStatus()
    } catch (error) {
      console.error('Error fixing referrals:', error)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral System Admin</h1>
          <p className="text-muted-foreground">
            Check and fix missing referral tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={checkReferralStatus}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Status
          </Button>
          {status && status.potentialMissingReferrals > 0 && (
            <Button
              onClick={fixReferrals}
              disabled={fixing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {fixing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Fix Missing Referrals
            </Button>
          )}
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Referral Codes</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.usersWithReferralCodes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Existing Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.existingReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Referrals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {status.potentialMissingReferrals}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {status && status.usersWithCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users with Referral Codes</CardTitle>
            <CardDescription>
              Users who signed up with a referral code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.usersWithCodes.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Referral Code: {user.referralCode}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Signed up: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline">{user.id.slice(0, 8)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fix Results
              {fixResult.success ? (
                <Badge className="bg-green-100 text-green-800">Success</Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {fixResult.summary.referralsCreated}
                </div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {fixResult.summary.referralsSkipped}
                </div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {fixResult.summary.errors}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {fixResult.summary.usersWithReferralCodes}
                </div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
            </div>

            {fixResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Detailed Results:</h4>
                {fixResult.details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div>
                      <div className="font-medium">{detail.email}</div>
                      <div className="text-muted-foreground">
                        Code: {detail.referralCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={detail.result.success ? "default" : "destructive"}
                      >
                        {detail.result.success ? "Success" : "Failed"}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {detail.result.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!status && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Check Status" to analyze the current referral system state
            </p>
            <Button onClick={checkReferralStatus} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}