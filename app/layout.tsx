import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Medical AI Chat - دستیار هوشمند پزشکی",
  description: "AI Assistant for Medical Clinic - دستیار هوشمند برای کلینیک پزشکی",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
