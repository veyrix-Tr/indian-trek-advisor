import { Suspense } from 'react'
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
  title: 'Core Trek-kin — Discover India\u2019s Greatest Treks',
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
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                color: "#1c1917",
                fontWeight: 500,
                fontSize: "14px",
                padding: "12px 16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              },
              classNames: {
                loading: "toast-loading",
                error: "toast-error",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
