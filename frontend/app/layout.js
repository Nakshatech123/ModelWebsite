

import { Inter } from 'next/font/google'
import AuthProvider from './AuthProvider' // ✅ CORRECT: Import the default export
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Website",
  description: 'A web application built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
