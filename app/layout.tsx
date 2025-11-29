import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-playfair',
});
const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-instrument-serif',
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
      <body className={`font-sans antialiased ${playfairDisplay.variable} ${instrumentSerif.variable}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
