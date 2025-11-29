"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LogOut, ChevronDown } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function RecordsPage() {
  const { isAuthenticated, user, isLoading, logout } = useSpotifyAuth()

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      <nav className="w-full px-6 py-4 relative z-10" style={{ backgroundColor: "transparent" }}>
        <div
          className="flex items-center justify-between rounded-full px-6 py-3 max-w-6xl mx-auto"
          style={{ backgroundColor: "#1DB954" }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Records title - en dorado */}
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-semibold"
              style={{ 
                color: "#FFD700", // Dorado
                textShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
              }}
            >
              Records
            </h1>

            {/* Authentication button */}
            {isLoading ? (
              <div className="px-5 py-2 text-sm text-gray-600" style={{ color: "#000" }}>
                Loading...
              </div>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90"
                    style={{
                      backgroundColor: "#000",
                      color: "#1DB954",
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 12px rgba(29, 185, 84, 0.3)"
                      e.currentTarget.style.transform = "scale(1.02)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none"
                      e.currentTarget.style.transform = "scale(1)"
                    }}
                  >
                    {/* User avatar */}
                    {user.images && user.images[0] ? (
                      <img
                        src={user.images[0].url}
                        alt={user.display_name || "User"}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: "#1DB954", color: "#000" }}
                      >
                        {user.display_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    {/* Greeting and name */}
                    <span className="text-sm font-medium" style={{ color: "#1DB954" }}>
                      Hello, {user.display_name?.split(" ")[0] || user.email?.split("@")[0] || "User"}
                    </span>
                    <ChevronDown size={16} style={{ color: "#1DB954" }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[180px] rounded-lg"
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                >
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                    style={{ color: "#fff" }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/"
                className="px-5 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
                style={{
                  backgroundColor: "#000",
                  color: "#1DB954",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 12px rgba(29, 185, 84, 0.3)"
                  e.currentTarget.style.transform = "scale(1.02)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.transform = "scale(1)"
                }}
              >
                Connect with Spotify
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido de Records */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8">
        <div className="w-full max-w-4xl mx-auto px-4">
          <h2 className="text-white text-3xl font-bold text-center mb-8">
            Your Records
          </h2>
          <p className="text-gray-400 text-center">
            This is where your playlist records will appear.
          </p>
        </div>
      </div>
    </main>
  )
}

