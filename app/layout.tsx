import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Spoty',
  description: 'Create personalized playlists with AI',
  icons: {
    icon: '/ionicon.png',
    apple: '/ionicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${playfairDisplay.variable}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
