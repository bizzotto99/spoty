"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ChevronDown, Send, Music, HelpCircle, ArrowLeft } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function RecordsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const { isAuthenticated, user, isLoading, login, logout } = useSpotifyAuth()
  const router = useRouter()

  // Check if there's an error or success in the URL (from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    const connected = params.get("connected")
    
    if (error) {
      console.error("Authentication error:", error)
      
      let errorMessage = "Oops! Connection failed"
      let errorDescription = "Let's try again"
      
      switch (error) {
        case "user_fetch_failed":
          errorMessage = "Couldn't get your info"
          errorDescription = "Try connecting again"
          break
        case "token_exchange_failed":
          errorMessage = "Connection issue"
          errorDescription = "Give it another shot"
          break
        case "invalid_state":
          errorMessage = "Security check"
          errorDescription = "Please reconnect"
          break
        default:
          errorMessage = "Something went wrong"
          errorDescription = "Try again in a moment"
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 4000,
      })
      window.history.replaceState({}, "", "/records")
    } else if (connected === "true") {
      window.history.replaceState({}, "", "/records")
      toast.success("All set!", {
        description: "You're connected to Spotify",
        duration: 2000,
      })
    }
  }, [])

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowConnectModal(true)
    }
  }, [isLoading, isAuthenticated])

  const handleConnect = () => {
    setShowConnectModal(false)
    login()
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      <nav className="w-full px-6 py-4 relative z-10" style={{ backgroundColor: "transparent" }}>
        <div
          className="flex items-center justify-between rounded-full px-6 py-3 max-w-6xl mx-auto"
          style={{ backgroundColor: "#1DB954" }}
        >
          {/* Logo */}
          <a href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </a>

          {/* Authentication button */}
          {isLoading ? (
            <div className="px-5 py-2 text-sm text-gray-600" style={{ color: "#000" }}>
              Loading...
            </div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90 min-w-[180px] justify-between"
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
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm font-medium truncate max-w-[60px]" style={{ color: "#1DB954" }}>
                      Hi, {(() => {
                        const name = user.display_name?.split(" ")[0] || user.email?.split("@")[0] || "User"
                        return name.length > 4 ? name.substring(0, 4) + "..." : name
                      })()}
                    </span>
                  </div>
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
                  className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                  style={{ color: "#fff" }}
                >
                  <Music className="mr-2 h-4 w-4" />
                  <span className="font-normal">My Playlists</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                  style={{ color: "#fff" }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
                
                {/* Plaquita Dale Play */}
                <div className="pl-2 pr-3 py-2 flex items-center gap-1 cursor-default border-t border-[#333]" style={{ backgroundColor: "#1a1a1a" }}>
                  <img 
                    src="/dp.png" 
                    alt="Dale Play" 
                    className="h-4 w-auto opacity-80"
                  />
                  <p className="font-semibold text-xs opacity-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#fff" }}>
                    Dale Play
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={login}
              className="px-5 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90"
              style={{
                backgroundColor: "#000",
                color: "#1DB954",
                border: "1px solid #1DB954",
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

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8 px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back()
                } else {
                  router.push("/")
                }
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center">
              <p className="text-gray-400 text-lg">Loading...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-white text-5xl font-bold" style={{ fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif", letterSpacing: "0.02em" }}>
                Records
              </h1>
              <span 
                className="text-5xl"
                style={{ 
                  color: "#ffffff",
                  fontFamily: "var(--font-playfair), 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif",
                  fontWeight: 300,
                  letterSpacing: "0.15em",
                  fontStyle: "italic",
                }}
              >
                Records
              </span>
            </div>
            <p className="text-gray-400 text-lg">Connect with Spotify to view your records</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Smart playlisting Powered by AI */}
            <div className="text-center mb-6">
              <p className="text-white text-lg font-medium" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Smart playlisting
              </p>
              <p className="text-white text-lg font-medium" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Powered by AI
              </p>
            </div>

            {/* Título dividido en dos renglones */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <h1 className="text-white text-5xl font-bold" style={{ fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif", letterSpacing: "0.02em" }}>
                  Scale Your Playlist Creation
                </h1>
                <span 
                  className="text-5xl"
                  style={{ 
                    color: "#ffffff",
                    fontFamily: "var(--font-playfair), 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif",
                    fontWeight: 300,
                    letterSpacing: "0.15em",
                    fontStyle: "italic",
                  }}
                >
                  for Your Label
                </span>
              </div>
              <p className="text-gray-400 text-lg">Create perfect playlists at scale for your record label</p>
            </div>

            {/* Input centrado */}
            <div className="w-full max-w-2xl mb-8">
              <form className="w-full flex flex-col items-center gap-4">
                <div
                  className="flex items-center gap-0 rounded-full transition-all duration-300 w-full"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  <input
                    type="text"
                    placeholder="Describe the playlist you want to create…"
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

            {/* Tips debajo del input - centrados */}
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4" style={{ color: "#1DB954" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-sm">Tips for better results</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                      <svg className="w-4 h-4" style={{ color: "#1DB954" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-medium">Activity <span className="text-red-400">*</span></p>
                  </div>
                  <p className="text-gray-400 text-xs">running, studying, working, gym, relaxing...</p>
                </div>
                
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                      <svg className="w-4 h-4" style={{ color: "#1DB954" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-medium">Context</p>
                  </div>
                  <p className="text-gray-400 text-xs">morning commute, party, focus, workout...</p>
                </div>
                
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                      <svg className="w-4 h-4" style={{ color: "#1DB954" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-medium">Time <span className="text-red-400">*</span></p>
                  </div>
                  <p className="text-gray-400 text-xs">30 minutes, 1 hour, 2 hours...</p>
                </div>
              </div>
              
              <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(29, 185, 84, 0.05)", border: "1px solid rgba(29, 185, 84, 0.2)" }}>
                <p className="text-gray-400 text-xs mb-1.5">💡 Example:</p>
                <p className="text-white text-sm italic" style={{ color: "#1DB954" }}>
                  "A playlist for running during morning commute, 30 minutes, high energy"
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal de conexión */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent
          className="sm:max-w-md rounded-2xl"
          showCloseButton={false}
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "1.5rem",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Connect with Spotify
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              You need to connect your Spotify account to access Records
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3" style={{ gap: "1rem" }}>
            <button
              onClick={() => setShowConnectModal(false)}
              className="px-6 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "transparent",
                color: "#fff",
                border: "1px solid #333",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              className="px-6 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "#1DB954",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1ed760"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1DB954"
              }}
            >
              Connect
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

