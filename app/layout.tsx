import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/components/supabase-provider"
import StripeProvider from "@/components/stripe-provider"
import { CommunityModal } from "@/components/community-modal"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Honua - Sustainability Social Platform",
  description: "Connect, share, and take action for a sustainable future",
  generator: 'v0.dev',
  icons: {
    icon: ['/favicon.ico', '/favicon.svg'],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <StripeProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <CommunityModal />
              <Toaster />
            </StripeProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
