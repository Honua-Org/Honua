"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { createClient } from "@/lib/supabase/client"
import { uploadAvatar } from "@/lib/storage"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Settings,
  User,
  Shield,
  Bell,
  Download,
  Trash2,
  Camera,
  MapPin,
  LinkIcon,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  Save,
  AlertTriangle,
} from "lucide-react"
import { DeleteAccountModal, ConfirmDeleteModal } from "@/components/delete-account-modals"

const sustainabilityCategories = [
  "Solar Energy",
  "Wind Power",
  "Recycling & Waste Reduction",
  "Sustainable Transportation",
  "Green Building",
  "Climate Action",
  "Conservation",
  "Renewable Energy",
  "Sustainable Agriculture",
  "Environmental Education",
]

export default function SettingsPage() {
  const session = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Profile settings state
  const [profileData, setProfileData] = useState({
    full_name: session?.user?.user_metadata?.full_name || "",
    username: session?.user?.user_metadata?.username || "",
    bio: "Environmental scientist passionate about renewable energy and climate action. Leading community solar initiatives across the Pacific Northwest. 🌱",
    location: "Portland, Oregon",
    website: "https://sarahgreen.eco",
    avatar_url: "/images/profiles/sarah-green-avatar.png",
    cover_url: "/images/covers/sarah-green-cover.png",
    interests: ["Solar Energy", "Climate Action", "Renewable Energy"],
  })
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (session?.user?.user_metadata?.username) {
        // Prevent empty required fields
    if (!profileData.full_name || !profileData.username) {
      toast({
        title: "Error",
        description: "Full name and username are required.",
        variant: "destructive",
      })
      return
    }
    try {
          const response = await fetch(`/api/profiles?username=${session.user.user_metadata.username}`)
          if (response.ok) {
            const data = await response.json()
            const profile = data.profile
            setProfileData({
              full_name: profile.full_name || '',
              username: profile.username || '',
              bio: profile.bio || '',
              location: profile.location || '',
              website: profile.website || '',
              avatar_url: profile.avatar_url || '',
              cover_url: profile.cover_url || '',
              interests: profile.interests || [],
            })
          }
        } catch (error) {
          console.error('Error loading profile data:', error)
        }
      }
    }
    
    loadProfileData()
  }, [session])

  // Account settings state
  const [accountData, setAccountData] = useState({
    email: session?.user?.email || "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public",
    show_email: false,
    show_location: true,
    allow_messages: true,
    allow_mentions: true,
    show_activity: true,
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    reposts: true,
    sustainability_updates: true,
    weekly_digest: true,
    community_events: true,
  })

  // Theme settings state
  const [themeSettings, setThemeSettings] = useState({
    theme: "system",
    compact_mode: false,
    reduce_motion: false,
    high_contrast: false,
  })

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check authentication
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload an avatar.",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)

    try {
      const result = await uploadAvatar(file, authUser.id)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setProfileData(prev => ({
        ...prev,
        avatar_url: result.url
      }))
      
      toast({
        title: "Avatar uploaded!",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      // Reset the file input
      event.target.value = ''
    }
  }

  const handleSaveProfile = async () => {
    try {
      // Only send fields that have changed or are not empty
      const updatePayload: any = {}
      if (profileData.full_name) updatePayload.full_name = profileData.full_name
      if (profileData.username) updatePayload.username = profileData.username
      if (profileData.bio !== undefined) updatePayload.bio = profileData.bio
      if (profileData.location !== undefined) updatePayload.location = profileData.location
      if (profileData.website !== undefined) updatePayload.website = profileData.website
      if (profileData.avatar_url !== undefined) updatePayload.avatar_url = profileData.avatar_url
      if (profileData.cover_url !== undefined) updatePayload.cover_url = profileData.cover_url

      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveAccount = async () => {
    if (accountData.new_password && accountData.new_password !== accountData.confirm_password) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Account updated!",
        description: "Your account settings have been saved successfully.",
      })
      setAccountData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSavePrivacy = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Privacy settings updated!",
        description: "Your privacy preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      })
    }
  }

  const handleSaveNotifications = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Notification settings updated!",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Data export started!",
        description: "You'll receive an email with your data export within 24 hours.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start data export.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-500 text-white text-xl">
                        {profileData.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Profile Photo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upload a new profile photo. JPG, PNG or GIF. Max size 10MB.
                    </p>
                    <div className="flex space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself and your sustainability journey..."
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">{profileData.bio.length}/280 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="Your location"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Sustainability Interests */}
                <div className="space-y-3">
                  <Label>Sustainability Interests</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select topics you're interested in to personalize your feed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sustainabilityCategories.map((category) => (
                      <Badge
                        key={category}
                        variant={profileData.interests.includes(category) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          profileData.interests.includes(category)
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        }`}
                        onClick={() => {
                          const newInterests = profileData.interests.includes(category)
                            ? profileData.interests.filter((i) => i !== category)
                            : [...profileData.interests, category]
                          setProfileData({ ...profileData, interests: newInterests })
                        }}
                      >
                        <Leaf className="w-3 h-3 mr-1" />
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="sustainability-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Account Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={accountData.current_password}
                          onChange={(e) => setAccountData({ ...accountData, current_password: e.target.value })}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          value={accountData.new_password}
                          onChange={(e) => setAccountData({ ...accountData, new_password: e.target.value })}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={accountData.confirm_password}
                          onChange={(e) => setAccountData({ ...accountData, confirm_password: e.target.value })}
                          placeholder="Confirm new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveAccount} className="sustainability-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Update Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Privacy & Visibility</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Control who can see your profile</p>
                    </div>
                    <Select
                      value={privacySettings.profile_visibility}
                      onValueChange={(value) => setPrivacySettings({ ...privacySettings, profile_visibility: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="followers">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Followers
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <Lock className="w-4 h-4 mr-2" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {[
                      {
                        key: "show_email",
                        label: "Show Email Address",
                        description: "Display your email on your public profile",
                      },
                      {
                        key: "show_location",
                        label: "Show Location",
                        description: "Display your location on your profile",
                      },
                      {
                        key: "allow_messages",
                        label: "Allow Direct Messages",
                        description: "Let other users send you direct messages",
                      },
                      {
                        key: "allow_mentions",
                        label: "Allow Mentions",
                        description: "Let other users mention you in posts",
                      },
                      {
                        key: "show_activity",
                        label: "Show Activity Status",
                        description: "Show when you're online or recently active",
                      },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>{setting.label}</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <Switch
                          checked={privacySettings[setting.key as keyof typeof privacySettings] as boolean}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({ ...privacySettings, [setting.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacy} className="sustainability-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.push_notifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, push_notifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Activity Notifications</h3>
                    {[
                      { key: "likes", label: "Likes", description: "When someone likes your posts" },
                      { key: "comments", label: "Comments", description: "When someone comments on your posts" },
                      { key: "follows", label: "New Followers", description: "When someone follows you" },
                      { key: "mentions", label: "Mentions", description: "When someone mentions you" },
                      { key: "reposts", label: "Reposts", description: "When someone reposts your content" },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>{setting.label}</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, [setting.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sustainability Updates</h3>
                    {[
                      {
                        key: "sustainability_updates",
                        label: "Sustainability News",
                        description: "Latest news and updates about sustainability",
                      },
                      {
                        key: "weekly_digest",
                        label: "Weekly Digest",
                        description: "Weekly summary of sustainability content",
                      },
                      {
                        key: "community_events",
                        label: "Community Events",
                        description: "Notifications about local sustainability events",
                      },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>{setting.label}</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, [setting.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} className="sustainability-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Export */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Export Your Data</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                      Download a copy of all your data including posts, comments, likes, and profile information.
                    </p>
                    <Button onClick={handleExportData} variant="outline" className="border-blue-300 text-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button onClick={handleDeleteAccount} variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Account Modals */}
                  <DeleteAccountModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => {
                      setShowDeleteModal(false)
                      setShowConfirmDeleteModal(true)
                    }}
                  />

                  <ConfirmDeleteModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => {
                      setShowConfirmDeleteModal(false)
                      setDeleteConfirmText("")
                    }}
                    confirmText={deleteConfirmText}
                    onConfirmTextChange={setDeleteConfirmText}
                    onConfirm={async () => {
                      try {
                        await new Promise((resolve) => setTimeout(resolve, 2000))
                        toast({
                          title: "Account deletion initiated",
                          description: "You will receive a confirmation email with your data export within 24 hours.",
                        })
                        setShowConfirmDeleteModal(false)
                        setDeleteConfirmText("")
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to delete account. Please try again.",
                          variant: "destructive",
                        })
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">234</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">2,847</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">456</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">850</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
