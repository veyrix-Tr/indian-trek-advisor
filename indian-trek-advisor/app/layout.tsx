import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OverlayProvider } from '@/components/overlays/overlay-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'TrekAdvisor — Discover India\u2019s Greatest Treks',
  description:
    '100 trails across India with real permit info, solo safety notes, and independent local guides. No large groups. No packaged tours.',
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#10140f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          async
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <OverlayProvider>
            <Suspense>
              <SiteHeader />
            </Suspense>
            {children}
            <SiteFooter />
          </OverlayProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #ea580c 100%)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                color: "#1c1917",
                fontWeight: 500,
                fontSize: "15px",
                padding: "14px 18px",
              },
            }}
          />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
