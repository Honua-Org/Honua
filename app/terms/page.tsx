"use client"

import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, Mail } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms of Service</h1>
              <p className="text-gray-600 dark:text-gray-400">Last updated: January 15, 2024</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Welcome to Honua</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Welcome to Honua, a sustainability-focused social platform that connects environmentally conscious
                individuals, organizations, and communities. By accessing or using our platform, you agree to be bound
                by these Terms of Service ("Terms"). Please read them carefully.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By creating an account, accessing, or using Honua's services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these
                Terms, please do not use our platform.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These Terms apply to all users of Honua, including visitors, registered users, and contributors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua is a social platform designed to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Connect individuals passionate about sustainability and environmental action</li>
                <li>Share knowledge, experiences, and best practices for sustainable living</li>
                <li>Organize and promote environmental initiatives and community actions</li>
                <li>Provide educational resources about sustainability topics</li>
                <li>Foster collaboration on environmental projects and solutions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To access certain features of Honua, you must create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You must be at least 13 years old to create an account. Users under 18 must have parental consent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. User Content and Conduct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You are responsible for all content you post, share, or transmit through Honua. By posting content, you
                represent that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>You own or have the right to use the content</li>
                <li>Your content does not violate any laws or third-party rights</li>
                <li>Your content is accurate and not misleading</li>
                <li>Your content aligns with Honua's sustainability mission</li>
              </ul>

              <Separator className="my-4" />

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                Prohibited Content and Conduct:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Harassment, bullying, or threatening behavior</li>
                <li>Hate speech, discrimination, or content promoting violence</li>
                <li>Spam, misleading information, or fraudulent content</li>
                <li>Content that promotes environmental harm or unsustainable practices</li>
                <li>Violation of intellectual property rights</li>
                <li>Illegal activities or content</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua respects intellectual property rights. The platform, including its design, features, and
                functionality, is owned by Honua and protected by copyright, trademark, and other laws.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By posting content on Honua, you grant us a non-exclusive, worldwide, royalty-free license to use,
                display, and distribute your content for the purpose of operating and improving our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of your personal information is
                governed by our{" "}
                <Link href="/privacy" className="text-green-600 hover:text-green-500 dark:text-green-400 underline">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua is built on the principles of sustainability, respect, and positive environmental impact. We
                expect all users to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Engage respectfully with other community members</li>
                <li>Share accurate information about sustainability topics</li>
                <li>Support and encourage environmental initiatives</li>
                <li>Report inappropriate content or behavior</li>
                <li>Contribute positively to environmental discussions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms,
                inappropriate conduct, or for any other reason at our discretion. You may also delete your account at
                any time through your account settings.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Upon termination, your right to use Honua will cease immediately, but these Terms will remain in effect
                regarding your past use of the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Disclaimers and Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua is provided "as is" without warranties of any kind. We do not guarantee the accuracy,
                completeness, or reliability of user-generated content. Users are responsible for verifying information
                before acting on it.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To the fullest extent permitted by law, Honua shall not be liable for any indirect, incidental, special,
                or consequential damages arising from your use of the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update these Terms from time to time. We will notify users of significant changes via email or
                platform notifications. Continued use of Honua after changes constitutes acceptance of the updated
                Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span>legal@honua.eco</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>Last updated: January 15, 2024</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
