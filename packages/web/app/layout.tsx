import type { Metadata } from 'next'
import './globals.css'
import { CustomCursor } from '@/components/CustomCursor'
// import { FibonacciBackground } from '@/components/FibonacciBackground'

export const metadata: Metadata = {
  title: 'akhai · sovereign intelligence',
  description: 'Multi-AI consensus research engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-mono antialiased bg-relic-white">
        {/* <FibonacciBackground /> */}
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
