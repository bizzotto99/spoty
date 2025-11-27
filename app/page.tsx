"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, LogOut, ChevronDown, Music } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function PlaylistPrompt() {
  const [prompt, setPrompt] = useState("")
  const { isAuthenticated, user, isLoading, login, logout } = useSpotifyAuth()

  // Check if there's an error in the URL (from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      console.error("Authentication error:", error)
      // You can show a toast or error message here
      // Clear the URL
      window.history.replaceState({}, "", "/")
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast("Hey! Let's get you connected 🎵", {
        description: "We need your Spotify to create something amazing. Connect and let's find your perfect sound!",
        duration: 6000,
        action: {
          label: "Connect",
          onClick: () => login(),
        },
        icon: <Music size={18} style={{ color: "#1DB954" }} />,
      })
      return
    }

    if (!prompt.trim()) {
      toast.error("Describe your playlist", {
        description: "Tell us what you want to listen to!",
        duration: 3000,
      })
      return
    }

    // Placeholder for future Gemini integration
    console.log("Prompt sent:", prompt)
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      <nav className="w-full px-6 py-4 relative z-10" style={{ backgroundColor: "#000" }}>
        <div
          className="flex items-center justify-between rounded-full px-6 py-3 max-w-6xl mx-auto"
          style={{ backgroundColor: "#1DB954" }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </div>

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
            <button
              onClick={login}
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
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-4">
          {/* Text above input */}
          <h2 className="text-white text-2xl font-medium text-center mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>
            What do you feel like listening to today?
          </h2>
          
          <div
            className="flex items-center gap-0 rounded-full transition-all duration-300 w-full"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the playlist you want…"
              className="flex-1 px-6 py-4 bg-transparent text-white placeholder-gray-500 outline-none font-sans text-base"
              style={{ color: "#ffffff" }}
            />

            <button
              type="submit"
              className="mr-3 p-2 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: "#1DB954",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 16px rgba(29, 185, 84, 0.4)"
                e.currentTarget.style.backgroundColor = "#1ed760"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.backgroundColor = "#1DB954"
              }}
              aria-label="Send prompt"
            >
              <Send size={20} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
