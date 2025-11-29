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

  // Check if there's an error or success in the URL (from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    const connected = params.get("connected")
    
    if (error) {
      console.error("Authentication error:", error)
      
      let errorMessage = "Connection failed"
      let errorDescription = "Please try connecting again"
      
      switch (error) {
        case "user_fetch_failed":
          errorMessage = "Could not fetch user information"
          errorDescription = "There was a problem retrieving your Spotify account. Please try again."
          break
        case "token_exchange_failed":
          errorMessage = "Authentication failed"
          errorDescription = "Could not complete authentication. Please try again."
          break
        case "invalid_state":
          errorMessage = "Security check failed"
          errorDescription = "Please try connecting again."
          break
        case "user_not_authorized":
          errorMessage = "Access denied"
          errorDescription = "Your email is not authorized to access this application. Please contact support."
          break
        case "database_error":
          errorMessage = "Database error"
          errorDescription = "There was a problem verifying your account. Please try again later."
          break
        case "no_email_provided":
          errorMessage = "Email required"
          errorDescription = "Your Spotify account doesn't have an email associated. Please add an email to your Spotify account and try again."
          break
        default:
          errorMessage = "Connection failed"
          errorDescription = `Error: ${error}. Please try again.`
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      })
      window.history.replaceState({}, "", "/")
    } else if (connected === "true") {
      // Limpiar la URL - el hook manejará la verificación
      window.history.replaceState({}, "", "/")
      // Mostrar mensaje de éxito
      toast.success("Connected!", {
        description: "Your Spotify account is now connected",
        duration: 2000,
      })
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast("Connect your Spotify", {
        description: "To create your playlist",
        duration: 4000,
        action: {
          label: "Connect",
          onClick: () => login(),
        },
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
