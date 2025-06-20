"use client"

import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Calendar, Mail, Lock, Eye, Database } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>
              <p className="text-gray-600 dark:text-gray-400">Last updated: January 15, 2024</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-green-600" />
                <span>Your Privacy Matters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                At Honua, we are committed to protecting your privacy and ensuring the security of your personal
                information. This Privacy Policy explains how we collect, use, share, and protect your information when
                you use our sustainability-focused social platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information You Provide to Us:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Account information (name, email, username, password)</li>
                  <li>Profile information (bio, location, website, sustainability interests)</li>
                  <li>Content you post (posts, comments, photos, videos)</li>
                  <li>Messages and communications with other users</li>
                  <li>Feedback, support requests, and survey responses</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Information We Collect Automatically:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, features used)</li>
                  <li>Location data (if you enable location services)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information from Third Parties:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Social media login information (if you choose to connect accounts)</li>
                  <li>Public information from sustainability organizations you're affiliated with</li>
                  <li>Analytics and advertising partners (aggregated and anonymized data)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use your information to provide, maintain, and improve Honua's services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Create and manage your account</li>
                <li>Enable you to connect with other sustainability-minded users</li>
                <li>Personalize your experience and content recommendations</li>
                <li>Send you notifications about platform activity and sustainability updates</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Improve our platform's features and functionality</li>
                <li>Ensure platform security and prevent fraud or abuse</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">With Your Consent:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>When you choose to share content publicly on the platform</li>
                  <li>When you participate in community events or initiatives</li>
                  <li>When you connect with sustainability organizations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Service Providers:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Cloud hosting and data storage providers</li>
                  <li>Email and communication service providers</li>
                  <li>Analytics and performance monitoring services</li>
                  <li>Payment processors (for premium features)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Legal Requirements:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>To comply with applicable laws and regulations</li>
                  <li>To respond to legal requests and court orders</li>
                  <li>To protect our rights, property, and safety</li>
                  <li>To prevent fraud and ensure platform security</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response procedures for security breaches</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                While we strive to protect your information, no method of transmission over the internet is 100% secure.
                We encourage you to use strong passwords and enable two-factor authentication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of the personal information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal information
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data to another service
                </li>
                <li>
                  <strong>Restriction:</strong> Request limitation of how we process your information
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain types of processing
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To exercise these rights, please contact us using the information provided below. We will respond to
                your request within the timeframe required by applicable law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use cookies and similar technologies to enhance your experience on Honua:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>Essential Cookies:</strong> Required for basic platform functionality
                </li>
                <li>
                  <strong>Performance Cookies:</strong> Help us understand how users interact with our platform
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Remember your preferences and settings
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Provide insights to improve our services
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You can control cookie settings through your browser preferences. Note that disabling certain cookies
                may affect platform functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If we become aware that we have collected personal information from
                a child under 13, we will take steps to delete such information.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Users between 13 and 18 years old must have parental consent to use our platform. We encourage parents
                to monitor their children's online activities and teach them about online safety.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Honua operates globally, and your information may be transferred to and processed in countries other
                than your own. We ensure that such transfers comply with applicable data protection laws and implement
                appropriate safeguards to protect your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable
                laws. We will notify you of significant changes via email or platform notifications. We encourage you to
                review this Privacy Policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4" />
                  <span>privacy@honua.eco</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: January 15, 2024</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                For questions about our Terms of Service, please see our{" "}
                <Link href="/terms" className="text-green-600 hover:text-green-500 dark:text-green-400 underline">
                  Terms of Service page
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
