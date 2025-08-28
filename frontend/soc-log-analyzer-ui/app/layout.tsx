'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Header() {
  const { isAuthenticated, username, clearCredentials } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Logged in as: <span className="font-medium">{username}</span>
        </div>
        <button
          onClick={clearCredentials}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Change credentials
        </button>
      </div>
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>SOC Log Analyzer</title>
        <meta name="description" content="Security Operations Center Log Analysis Tool" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}